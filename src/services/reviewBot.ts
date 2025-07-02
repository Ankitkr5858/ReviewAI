import { GitHubService } from './github';
import { CodeAnalysisService, CodeIssue } from './codeAnalysis';

export interface ReviewConfig {
  autoMerge: boolean;
  autoFix: boolean;
  strictMode: boolean;
  dailyReview: boolean;
}

export interface ReviewResult {
  success: boolean;
  issuesFound: number;
  criticalIssues: number;
  autoMerged?: boolean;
  issues?: CodeIssue[];
  issueNumber?: number;
  isOwnPR?: boolean;
  hasConflicts?: boolean;
  conflictDetails?: any;
  prDetails?: {
    title: string;
    author: string;
    branch: string;
    filesChanged: number;
  };
  fileChanges?: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
    changedLines: number[];
  }>;
}

export class ReviewBot {
  private github: GitHubService;
  private analyzer: CodeAnalysisService;
  private config: ReviewConfig;

  constructor(
    githubToken: string,
    openaiApiKey: string,
    config: ReviewConfig
  ) {
    this.github = new GitHubService(githubToken);
    this.analyzer = new CodeAnalysisService(openaiApiKey);
    this.config = config;
  }

  async reviewPullRequest(owner: string, repo: string, pullNumber: number): Promise<ReviewResult> {
    try {
      console.log(`Starting review for PR #${pullNumber} in ${owner}/${repo}`);
      
      const currentUser = await this.getCurrentUser();
      const prDetails = await this.github.request(`/repos/${owner}/${repo}/pulls/${pullNumber}`);
      const isOwnPR = prDetails.user.login === currentUser.login;
      
      console.log(`PR Author: ${prDetails.user.login}, Current User: ${currentUser.login}, Is Own PR: ${isOwnPR}`);
      
      const files = await this.github.getPullRequestFiles(owner, repo, pullNumber);
      const allIssues: CodeIssue[] = [];
      const reviewComments: string[] = [];
      const fileChanges: any[] = [];
      let hasConflicts = false;
      let conflictDetails: any = null;

      // Check for conflicts first
      for (const file of files) {
        if (file.status === 'removed') continue;
        
        const content = await this.github.getFileContent(owner, repo, file.filename, prDetails.head.sha);
        if (!content) continue;

        // NEW: Check for merge conflicts
        const conflictCheck = this.analyzer.checkForConflicts(content);
        if (conflictCheck.hasConflicts) {
          hasConflicts = true;
          conflictDetails = {
            ...conflictCheck.conflictDetails,
            conflictFiles: [file.filename]
          };
          
          console.log(`🚨 Conflicts detected in ${file.filename}`);
          
          // If conflicts can be auto-resolved, try to resolve them
          if (conflictCheck.conflictDetails?.canAutoResolve) {
            console.log(`🔧 Attempting to auto-resolve conflicts in ${file.filename}`);
            try {
              const resolvedContent = await this.analyzer.autoResolveConflicts(content, file.filename);
              
              // Update the file with resolved content
              const currentSha = await this.github.getFileSha(owner, repo, file.filename, prDetails.head.sha);
              if (currentSha) {
                await this.github.updateFileContent(
                  owner,
                  repo,
                  file.filename,
                  resolvedContent,
                  `🤖 ReviewAI: Auto-resolve merge conflicts in ${file.filename}`,
                  currentSha,
                  prDetails.head.ref
                );
                
                console.log(`✅ Auto-resolved conflicts in ${file.filename}`);
                hasConflicts = false; // Conflicts resolved
                conflictDetails = null;
              }
            } catch (error) {
              console.error(`❌ Failed to auto-resolve conflicts in ${file.filename}:`, error);
            }
          }
          
          break; // Stop analysis if conflicts found and can't be resolved
        }
      }

      // If conflicts exist and couldn't be resolved, return early
      if (hasConflicts) {
        return {
          success: true,
          issuesFound: 0,
          criticalIssues: 0,
          hasConflicts: true,
          conflictDetails,
          isOwnPR,
          prDetails: {
            title: prDetails.title,
            author: prDetails.user.login,
            branch: `${prDetails.head.ref} → ${prDetails.base.ref}`,
            filesChanged: files.length
          }
        };
      }

      // Continue with normal analysis if no conflicts
      for (const file of files) {
        if (file.status === 'removed') continue;
        
        console.log(`Analyzing changes in ${file.filename}...`);
        
        const changedLines = this.extractChangedLines(file.patch || '');
        
        fileChanges.push({
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes,
          patch: file.patch,
          changedLines: changedLines
        });
        
        if (changedLines.length === 0) {
          console.log(`No changed lines found in ${file.filename}, skipping analysis`);
          continue;
        }
        
        const content = await this.github.getFileContent(owner, repo, file.filename, prDetails.head.sha);
        if (!content) continue;

        const language = this.getLanguageFromFilename(file.filename);
        
        // Enhanced analysis with prettier/linting
        const analysis = await this.analyzer.analyzeCode(content, file.filename, language);
        
        // Filter out info-level issues
        const filteredIssues = analysis.issues.filter(issue => 
          issue.severity === 'high' || issue.severity === 'medium'
        );
        
        allIssues.push(...filteredIssues);
        
        if (filteredIssues.length > 0) {
          reviewComments.push(`## 📁 ${file.filename}`);
          reviewComments.push('');
          
          // Group issues by category and severity
          const criticalIssues = filteredIssues.filter(i => i.severity === 'high');
          const warningIssues = filteredIssues.filter(i => i.severity === 'medium');
          
          // Group by category
          const securityIssues = filteredIssues.filter(i => i.category === 'security');
          const prettierIssues = filteredIssues.filter(i => i.category === 'prettier');
          const eslintIssues = filteredIssues.filter(i => i.category === 'eslint');
          const bestPracticeIssues = filteredIssues.filter(i => i.category === 'best-practice');
          
          if (securityIssues.length > 0) {
            reviewComments.push('### 🔒 Security Issues');
            securityIssues.forEach(issue => {
              reviewComments.push(`- **Line ${issue.line}**: ${issue.message}`);
              if (issue.suggestion) {
                reviewComments.push(`  💡 **Fix**: ${issue.suggestion}`);
              }
            });
            reviewComments.push('');
          }
          
          if (criticalIssues.length > 0) {
            reviewComments.push('### 🔴 Critical Issues');
            criticalIssues.forEach(issue => {
              reviewComments.push(`- **Line ${issue.line}**: ${issue.message}`);
              if (issue.suggestion) {
                reviewComments.push(`  💡 **Fix**: ${issue.suggestion}`);
              }
              if (issue.originalCode && issue.suggestedCode) {
                reviewComments.push('  ```diff');
                reviewComments.push(`  - ${issue.originalCode.trim()}`);
                reviewComments.push(`  + ${issue.suggestedCode.trim()}`);
                reviewComments.push('  ```');
              }
            });
            reviewComments.push('');
          }
          
          if (prettierIssues.length > 0) {
            reviewComments.push('### 🎨 Prettier Formatting');
            prettierIssues.forEach(issue => {
              reviewComments.push(`- **Line ${issue.line}**: ${issue.message}`);
              if (issue.suggestion) {
                reviewComments.push(`  💡 **Suggestion**: ${issue.suggestion}`);
              }
            });
            reviewComments.push('');
          }
          
          if (eslintIssues.length > 0) {
            reviewComments.push('### 📋 ESLint Issues');
            eslintIssues.forEach(issue => {
              reviewComments.push(`- **Line ${issue.line}**: ${issue.message}`);
              if (issue.suggestion) {
                reviewComments.push(`  💡 **Suggestion**: ${issue.suggestion}`);
              }
            });
            reviewComments.push('');
          }
          
          if (warningIssues.length > 0) {
            reviewComments.push('### 🟡 Warnings (Can be ignored)');
            warningIssues.forEach(issue => {
              reviewComments.push(`- **Line ${issue.line}**: ${issue.message}`);
              if (issue.suggestion) {
                reviewComments.push(`  💡 **Suggestion**: ${issue.suggestion}`);
              }
            });
            reviewComments.push('');
          }
        }
      }

      // For own PRs, return analysis without creating GitHub review
      if (isOwnPR) {
        console.log('This is own PR - returning analysis results without creating GitHub review');
        
        return {
          success: true,
          issuesFound: allIssues.length,
          criticalIssues: allIssues.filter(i => i.severity === 'high').length,
          issues: allIssues,
          isOwnPR: true,
          hasConflicts: false,
          prDetails: {
            title: prDetails.title,
            author: prDetails.user.login,
            branch: `${prDetails.head.ref} → ${prDetails.base.ref}`,
            filesChanged: files.length
          },
          fileChanges: fileChanges
        };
      }

      // For other PRs, create the review
      const reviewBody = this.generateReviewBody(allIssues, reviewComments);
      const reviewEvent = this.determineReviewEvent(allIssues);
      
      await this.github.createPullRequestReview(
        owner,
        repo,
        pullNumber,
        reviewBody,
        reviewEvent
      );

      // Auto-merge if no critical issues and enabled
      let autoMerged = false;
      if (this.config.autoMerge && !this.hasCriticalIssues(allIssues)) {
        await this.github.mergePullRequest(owner, repo, pullNumber);
        autoMerged = true;
        console.log(`Auto-merged PR #${pullNumber}`);
      }

      return {
        success: true,
        issuesFound: allIssues.length,
        criticalIssues: allIssues.filter(i => i.severity === 'high').length,
        autoMerged,
        issues: allIssues,
        isOwnPR: false,
        hasConflicts: false,
        prDetails: {
          title: prDetails.title,
          author: prDetails.user.login,
          branch: `${prDetails.head.ref} → ${prDetails.base.ref}`,
          filesChanged: files.length
        },
        fileChanges: fileChanges
      };
    } catch (error) {
      console.error('Review failed:', error);
      
      if (error instanceof Error && error.message.includes('Can not request changes on your own pull request')) {
        try {
          const prDetails = await this.github.request(`/repos/${owner}/${repo}/pulls/${pullNumber}`);
          const files = await this.github.getPullRequestFiles(owner, repo, pullNumber);
          const allIssues: CodeIssue[] = [];
          const fileChanges: any[] = [];

          for (const file of files) {
            if (file.status === 'removed') continue;
            
            const changedLines = this.extractChangedLines(file.patch || '');
            
            fileChanges.push({
              filename: file.filename,
              status: file.status,
              additions: file.additions,
              deletions: file.deletions,
              changes: file.changes,
              patch: file.patch,
              changedLines: changedLines
            });
            
            if (changedLines.length === 0) continue;
            
            const content = await this.github.getFileContent(owner, repo, file.filename, prDetails.head.sha);
            if (!content) continue;

            const language = this.getLanguageFromFilename(file.filename);
            const analysis = await this.analyzer.analyzeCode(content, file.filename, language);
            
            const filteredIssues = analysis.issues.filter(issue => 
              issue.severity === 'high' || issue.severity === 'medium'
            );
            
            allIssues.push(...filteredIssues);
          }

          return {
            success: true,
            issuesFound: allIssues.length,
            criticalIssues: allIssues.filter(i => i.severity === 'high').length,
            issues: allIssues,
            isOwnPR: true,
            hasConflicts: false,
            prDetails: {
              title: prDetails.title,
              author: prDetails.user.login,
              branch: `${prDetails.head.ref} → ${prDetails.base.ref}`,
              filesChanged: files.length
            },
            fileChanges: fileChanges
          };
        } catch (analysisError) {
          console.error('Analysis failed:', analysisError);
          throw error;
        }
      }
      
      throw error;
    }
  }

  private extractChangedLines(patch: string): number[] {
    const changedLines: number[] = [];
    const lines = patch.split('\n');
    let currentLine = 0;
    
    for (const line of lines) {
      const hunkMatch = line.match(/^@@ -\d+,?\d* \+(\d+),?\d* @@/);
      if (hunkMatch) {
        currentLine = parseInt(hunkMatch[1]) - 1;
        continue;
      }
      
      if (line.startsWith('+') && !line.startsWith('+++')) {
        currentLine++;
        changedLines.push(currentLine);
      } else if (line.startsWith(' ')) {
        currentLine++;
      }
    }
    
    console.log(`Extracted ${changedLines.length} changed lines: ${changedLines.slice(0, 10).join(', ')}${changedLines.length > 10 ? '...' : ''}`);
    return changedLines;
  }

  private async getCurrentUser() {
    return this.github.request('/user');
  }

  async reviewMainBranch(owner: string, repo: string): Promise<ReviewResult> {
    try {
      console.log(`Starting comprehensive review for ${owner}/${repo} main branch`);
      
      const allIssues: CodeIssue[] = [];
      const checkedFiles = new Set<string>();

      const filesToAnalyze = [
        'src/index.js', 'src/index.ts', 'src/App.js', 'src/App.tsx',
        'src/main.tsx', 'src/main.js', 'index.js', 'index.ts',
        'app.js', 'app.ts', 'server.js', 'server.ts',
        'package.json', 'README.md', 'tsconfig.json',
        'webpack.config.js', 'vite.config.ts', 'vite.config.js',
      ];

      for (const filename of filesToAnalyze) {
        if (checkedFiles.has(filename)) continue;
        checkedFiles.add(filename);

        try {
          const content = await this.github.getFileContent(owner, repo, filename);
          if (!content) continue;

          const language = this.getLanguageFromFilename(filename);
          
          if (!this.isCodeFile(filename)) continue;
          
          // Enhanced analysis with prettier/linting
          const analysis = await this.analyzer.analyzeCode(content, filename, language);
          
          const filteredIssues = analysis.issues.filter(issue => 
            issue.severity === 'high' || issue.severity === 'medium'
          );
          
          allIssues.push(...filteredIssues);
          
          console.log(`Analyzed ${filename}: found ${filteredIssues.length} critical/warning issues`);
        } catch (error) {
          continue;
        }
      }

      let issueNumber;
      if (allIssues.length > 0) {
        const issueTitle = `Daily Review: ${allIssues.length} issues found in main branch`;
        const issueBody = this.generateIssueBody(allIssues);
        
        const issue = await this.github.createIssue(owner, repo, issueTitle, issueBody);
        issueNumber = issue.number;
        
        console.log(`Created GitHub issue #${issueNumber} with ${allIssues.length} issues`);
      }

      return {
        success: true,
        issuesFound: allIssues.length,
        criticalIssues: allIssues.filter(i => i.severity === 'high').length,
        issues: allIssues,
        issueNumber,
        hasConflicts: false,
      };
    } catch (error) {
      console.error('Daily review failed:', error);
      throw error;
    }
  }

  private isCodeFile(filename: string): boolean {
    const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.php', '.rb'];
    return codeExtensions.some(ext => filename.endsWith(ext));
  }

  async fixIssuesWithAI(owner: string, repo: string, issues: CodeIssue[]): Promise<any> {
    try {
      console.log(`Starting AI fix for ${issues.length} issues in ${owner}/${repo}`);
      
      if (!issues || issues.length === 0) {
        return {
          success: true,
          alreadyFixed: true,
          message: 'No issues to fix',
          fixedFiles: [],
          fixedIssues: 0,
        };
      }

      const issuesByFile = this.groupIssuesByFile(issues);
      const fixedFiles: string[] = [];
      const fixedIssues: CodeIssue[] = [];
      const commitMessages: string[] = [];
      const fixDetails: any[] = [];

      console.log(`Processing ${Object.keys(issuesByFile).length} files with issues`);

      for (const [filename, fileIssues] of Object.entries(issuesByFile)) {
        try {
          console.log(`Processing file: ${filename} with ${fileIssues.length} issues`);
          
          const currentContent = await this.github.getFileContent(owner, repo, filename);
          if (!currentContent) {
            console.log(`Could not get content for ${filename}, skipping`);
            continue;
          }

          const currentSha = await this.github.getFileSha(owner, repo, filename);
          if (!currentSha) {
            console.log(`Could not get SHA for ${filename}, skipping`);
            continue;
          }

          const fixedContent = await this.analyzer.fixIssues(currentContent, fileIssues);
          
          if (fixedContent === currentContent) {
            console.log(`No changes needed for ${filename}`);
            continue;
          }

          console.log(`Content changed for ${filename}, applying fixes...`);

          const fixableIssues = fileIssues.filter(i => i.fixable);
          
          const detailedExplanations = fixableIssues.map(issue => {
            const explanation = this.getDetailedFixExplanation(issue);
            
            fixDetails.push({
              file: filename,
              line: issue.line,
              issue: issue.message,
              fix: explanation.whatWasFixed,
              reason: explanation.whyItMatters
            });

            return `
📍 **Line ${issue.line}**: ${issue.message}
   🔧 **What was fixed**: ${explanation.whatWasFixed}
   💡 **Why this matters**: ${explanation.whyItMatters}
   🎯 **Impact**: ${explanation.impact}
   📚 **Category**: ${issue.category || 'general'}`;
          }).join('\n\n');

          const commitMessage = `🤖 ReviewAI: Auto-fix ${fixableIssues.length} issues in ${filename}

## 🔍 Issues Fixed:
${detailedExplanations}

## 📊 Summary:
- Fixed ${fixableIssues.length} code quality issues
- Improved code maintainability and security
- Applied prettier formatting and ESLint rules
- Enhanced code readability

---
🤖 Auto-fixed by ReviewAI`;

          const updateResult = await this.github.updateFileContent(
            owner,
            repo,
            filename,
            fixedContent,
            commitMessage,
            currentSha
          );

          if (updateResult) {
            fixedFiles.push(filename);
            fixedIssues.push(...fixableIssues);
            commitMessages.push(commitMessage);
            
            console.log(`✅ Successfully fixed ${fixableIssues.length} issues in ${filename}`);
          } else {
            console.log(`❌ Failed to update ${filename}`);
          }

        } catch (fileError) {
          console.error(`Failed to process ${filename}:`, fileError);
        }
      }

      if (fixedIssues.length > 0) {
        console.log(`Attempting to close related GitHub issues for ${fixedIssues.length} fixed issues`);
        await this.autoCloseRelatedIssues(owner, repo, fixedIssues);
      }

      const result = {
        success: true,
        message: fixedFiles.length > 0 
          ? `AI fixes applied to ${fixedFiles.length} files` 
          : 'No fixable issues found',
        fixedFiles,
        fixedIssues: fixedIssues.length,
        fixDetails,
        commitMessage: fixedFiles.length > 0 
          ? `🤖 ReviewAI: Auto-fixed ${fixedIssues.length} issues across ${fixedFiles.length} files`
          : 'No changes made',
        commitSha: 'latest',
        alreadyFixed: fixedFiles.length === 0
      };

      console.log('Fix result:', result);
      return result;

    } catch (error) {
      console.error('AI fix failed:', error);
      throw new Error(`AI fix failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getDetailedFixExplanation(issue: CodeIssue) {
    const rule = issue.rule?.toLowerCase() || '';
    const message = issue.message.toLowerCase();
    const category = issue.category || 'general';

    // Category-specific explanations
    if (category === 'prettier') {
      return {
        whatWasFixed: "Applied prettier formatting rules",
        whyItMatters: "Consistent code formatting improves readability and reduces merge conflicts in team environments",
        impact: "Better code consistency and team collaboration"
      };
    }

    if (category === 'eslint') {
      return {
        whatWasFixed: "Fixed ESLint rule violation",
        whyItMatters: "ESLint rules enforce best practices and catch potential bugs before runtime",
        impact: "Improved code quality and reduced potential for bugs"
      };
    }

    if (category === 'security') {
      return {
        whatWasFixed: "Fixed security vulnerability",
        whyItMatters: "Security issues can lead to data breaches and system compromises",
        impact: "Enhanced application security and user data protection"
      };
    }

    // Existing rule-specific explanations...
    if (rule.includes('semi') || message.includes('semicolon')) {
      return {
        whatWasFixed: "Added semicolon (;) at the end of the statement",
        whyItMatters: "JavaScript's Automatic Semicolon Insertion (ASI) can cause unexpected behavior when code is minified or certain patterns are used",
        impact: "Prevents runtime errors and makes code more predictable"
      };
    }

    return {
      whatWasFixed: `Applied fix according to ${issue.rule || 'coding standards'}`,
      whyItMatters: "This change follows industry best practices and improves code quality",
      impact: "Better maintainability and fewer potential bugs"
    };
  }

  private async autoCloseRelatedIssues(owner: string, repo: string, fixedIssues: CodeIssue[]) {
    try {
      console.log(`Looking for GitHub issues to close for ${fixedIssues.length} fixed issues`);
      
      const openIssues = await this.github.request(`/repos/${owner}/${repo}/issues?state=open&per_page=100`);
      
      console.log(`Found ${openIssues.length} open issues to check`);

      for (const issue of openIssues) {
        const isReviewAIIssue = issue.title.includes('Daily Review:') || 
                               issue.title.includes('ReviewAI') ||
                               (issue.body && (
                                 issue.body.includes('Generated by ReviewAI') || 
                                 issue.body.includes('ReviewAI daily review') ||
                                 issue.body.includes('🔍 Generated by ReviewAI')
                               ));

        if (isReviewAIIssue) {
          console.log(`Found ReviewAI issue to close: #${issue.number} - ${issue.title}`);
          
          const closeComment = `🤖 **ReviewAI Auto-Resolution**

This issue has been automatically resolved! Here's what was fixed:

${fixedIssues.map(issue => {
  const explanation = this.getDetailedFixExplanation(issue);
  return `## 📍 ${issue.file}:${issue.line}
**Issue**: ${issue.message}
**Category**: ${issue.category || 'general'}
**Fix Applied**: ${explanation.whatWasFixed}
**Why This Matters**: ${explanation.whyItMatters}
**Impact**: ${explanation.impact}`;
}).join('\n\n')}

## 📊 Summary
- **${fixedIssues.length}** issues automatically fixed
- **${new Set(fixedIssues.map(i => i.file)).size}** files updated
- Code quality improvements applied
- Prettier formatting and ESLint rules enforced

---
*🔧 Automatically resolved by ReviewAI*`;

          try {
            await this.github.request(`/repos/${owner}/${repo}/issues/${issue.number}/comments`, {
              method: 'POST',
              body: JSON.stringify({ body: closeComment }),
            });

            await this.github.updateIssue(owner, repo, issue.number, { 
              state: 'closed',
              state_reason: 'completed'
            });
            
            console.log(`✅ Successfully closed GitHub issue #${issue.number}: ${issue.title}`);
          } catch (closeError) {
            console.error(`Failed to close issue #${issue.number}:`, closeError);
          }
        }
      }
    } catch (error) {
      console.error('Failed to auto-close issues:', error);
    }
  }

  private generateReviewBody(issues: CodeIssue[], comments: string[]): string {
    const criticalCount = issues.filter(i => i.severity === 'high').length;
    const warningCount = issues.filter(i => i.severity === 'medium').length;
    
    // Group by category
    const securityCount = issues.filter(i => i.category === 'security').length;
    const prettierCount = issues.filter(i => i.category === 'prettier').length;
    const eslintCount = issues.filter(i => i.category === 'eslint').length;

    let body = '# 🤖 ReviewAI Analysis\n\n';
    
    if (issues.length === 0) {
      body += '✅ **Excellent work!** No critical issues found in the changes.\n\n';
      body += 'The code changes look clean and follow best practices. Ready to merge! 🚀';
    } else {
      body += `## 📊 Summary\n\n`;
      body += `Found **${issues.length} issues** in the changed code:\n\n`;
      body += `| Category | Count |\n`;
      body += `|----------|-------|\n`;
      body += `| 🔒 Security | ${securityCount} |\n`;
      body += `| 🔴 Critical | ${criticalCount} |\n`;
      body += `| 🟡 Warning | ${warningCount} |\n`;
      body += `| 🎨 Prettier | ${prettierCount} |\n`;
      body += `| 📋 ESLint | ${eslintCount} |\n\n`;
      
      if (criticalCount > 0 || securityCount > 0) {
        body += '⚠️ **Critical/Security issues must be addressed before merging.**\n\n';
      }
      
      body += '## 📝 Detailed Review\n\n';
      body += comments.join('\n');
      
      body += '\n\n## 🛠️ Fix Options\n\n';
      body += '- **🤖 AI Auto-Fix**: Use ReviewAI to automatically fix these issues\n';
      body += '- **✋ Manual Fix**: Review and fix issues manually\n';
      body += '- **🎨 Format Code**: Run prettier and ESLint to fix formatting issues\n';
    }

    body += '\n\n---\n*🔍 Automated review by ReviewAI • Enhanced with Prettier & ESLint*';
    return body;
  }

  private generateIssueBody(issues: CodeIssue[]): string {
    let body = '# 🔍 Daily Main Branch Review\n\n';
    body += `Found **${issues.length} issues** that need attention:\n\n`;

    const criticalCount = issues.filter(i => i.severity === 'high').length;
    const warningCount = issues.filter(i => i.severity === 'medium').length;
    const securityCount = issues.filter(i => i.category === 'security').length;
    const prettierCount = issues.filter(i => i.category === 'prettier').length;
    const eslintCount = issues.filter(i => i.category === 'eslint').length;

    body += `## 📊 Summary\n\n`;
    body += `| Category | Count |\n`;
    body += `|----------|-------|\n`;
    body += `| 🔒 Security | ${securityCount} |\n`;
    body += `| 🔴 Critical | ${criticalCount} |\n`;
    body += `| 🟡 Warning | ${warningCount} |\n`;
    body += `| 🎨 Prettier | ${prettierCount} |\n`;
    body += `| 📋 ESLint | ${eslintCount} |\n\n`;

    const groupedIssues = this.groupIssuesByFile(issues);
    
    body += `## 📁 Issues by File\n\n`;
    
    Object.entries(groupedIssues).forEach(([filename, fileIssues]) => {
      body += `### ${filename}\n\n`;
      fileIssues.forEach(issue => {
        const emoji = issue.severity === 'high' ? '🔴' : '🟡';
        const categoryEmoji = issue.category === 'security' ? '🔒' : 
                             issue.category === 'prettier' ? '🎨' : 
                             issue.category === 'eslint' ? '📋' : '⚙️';
        body += `${emoji} ${categoryEmoji} **Line ${issue.line}**: ${issue.message}\n`;
        if (issue.suggestion) {
          body += `   💡 **Fix**: ${issue.suggestion}\n`;
        }
        body += '\n';
      });
    });

    body += '\n## 🛠️ Fix Options\n\n';
    body += '- **🤖 AI Auto-Fix**: Use ReviewAI to automatically fix these issues\n';
    body += '- **🎨 Format Code**: Run prettier and ESLint to fix formatting issues\n';
    body += '- **✋ Manual Review**: Review and fix issues manually\n';

    body += '\n---\n*🔍 Generated by ReviewAI • Enhanced with Prettier & ESLint*';
    return body;
  }

  private determineReviewEvent(issues: CodeIssue[]): 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT' {
    const criticalIssues = issues.filter(i => i.severity === 'high').length;
    const securityIssues = issues.filter(i => i.category === 'security').length;
    
    if (criticalIssues > 0 || securityIssues > 0) {
      return 'REQUEST_CHANGES';
    } else if (issues.length === 0) {
      return 'APPROVE';
    } else {
      return 'COMMENT';
    }
  }

  private hasCriticalIssues(issues: CodeIssue[]): boolean {
    return issues.some(issue => issue.severity === 'high' || issue.category === 'security');
  }

  private groupIssuesByFile(issues: CodeIssue[]): Record<string, CodeIssue[]> {
    return issues.reduce((acc, issue) => {
      if (!acc[issue.file]) {
        acc[issue.file] = [];
      }
      acc[issue.file].push(issue);
      return acc;
    }, {} as Record<string, CodeIssue[]>);
  }

  private getLanguageFromFilename(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'py':
        return 'python';
      case 'java':
        return 'java';
      case 'cpp':
      case 'cc':
      case 'cxx':
        return 'cpp';
      case 'c':
        return 'c';
      case 'go':
        return 'go';
      case 'rs':
        return 'rust';
      case 'php':
        return 'php';
      case 'rb':
        return 'ruby';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      default:
        return 'text';
    }
  }
}