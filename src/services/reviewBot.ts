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
      
      // Get PR files
      const files = await this.github.getPullRequestFiles(owner, repo, pullNumber);
      const allIssues: CodeIssue[] = [];
      const reviewComments: string[] = [];

      // Analyze each file
      for (const file of files) {
        if (file.status === 'removed') continue;
        
        const content = await this.github.getFileContent(owner, repo, file.filename);
        if (!content) continue;

        const language = this.getLanguageFromFilename(file.filename);
        const analysis = await this.analyzer.analyzeCode(content, file.filename, language);
        
        allIssues.push(...analysis.issues);
        
        if (analysis.issues.length > 0) {
          reviewComments.push(`## 📁 ${file.filename}`);
          reviewComments.push('');
          
          // Group issues by severity
          const criticalIssues = analysis.issues.filter(i => i.severity === 'high');
          const warningIssues = analysis.issues.filter(i => i.severity === 'medium');
          const infoIssues = analysis.issues.filter(i => i.severity === 'low');
          
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
          
          if (warningIssues.length > 0) {
            reviewComments.push('### 🟡 Warnings');
            warningIssues.forEach(issue => {
              reviewComments.push(`- **Line ${issue.line}**: ${issue.message}`);
              if (issue.suggestion) {
                reviewComments.push(`  💡 **Suggestion**: ${issue.suggestion}`);
              }
            });
            reviewComments.push('');
          }
          
          if (infoIssues.length > 0) {
            reviewComments.push('### 🔵 Info');
            infoIssues.forEach(issue => {
              reviewComments.push(`- **Line ${issue.line}**: ${issue.message}`);
            });
            reviewComments.push('');
          }
        }
      }

      // Create review
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
      };
    } catch (error) {
      console.error('Review failed:', error);
      throw error;
    }
  }

  async reviewMainBranch(owner: string, repo: string): Promise<ReviewResult> {
    try {
      console.log(`Starting comprehensive review for ${owner}/${repo} main branch`);
      
      const allIssues: CodeIssue[] = [];
      const checkedFiles = new Set<string>();

      // Get repository structure and analyze key files
      const filesToAnalyze = [
        'src/index.js',
        'src/index.ts',
        'src/App.js',
        'src/App.tsx',
        'src/main.tsx',
        'src/main.js',
        'index.js',
        'index.ts',
        'app.js',
        'app.ts',
        'server.js',
        'server.ts',
        'package.json',
        'README.md',
        'tsconfig.json',
        'webpack.config.js',
        'vite.config.ts',
        'vite.config.js',
      ];

      // Also try to get files from common directories
      const commonDirs = ['src', 'lib', 'components', 'utils', 'services'];
      
      for (const filename of filesToAnalyze) {
        if (checkedFiles.has(filename)) continue;
        checkedFiles.add(filename);

        try {
          const content = await this.github.getFileContent(owner, repo, filename);
          if (!content) continue;

          const language = this.getLanguageFromFilename(filename);
          
          // Skip non-code files for detailed analysis
          if (!this.isCodeFile(filename)) continue;
          
          const analysis = await this.analyzer.analyzeCode(content, filename, language);
          allIssues.push(...analysis.issues);
          
          console.log(`Analyzed ${filename}: found ${analysis.issues.length} issues`);
        } catch (error) {
          // File might not exist, continue
          continue;
        }
      }

      // Create issue if problems found
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

      // Group issues by file for efficient processing
      const issuesByFile = this.groupIssuesByFile(issues);
      const fixedFiles: string[] = [];
      const fixedIssues: CodeIssue[] = [];
      const commitMessages: string[] = [];

      console.log(`Processing ${Object.keys(issuesByFile).length} files with issues`);

      for (const [filename, fileIssues] of Object.entries(issuesByFile)) {
        try {
          console.log(`Processing file: ${filename} with ${fileIssues.length} issues`);
          
          // Get current file content and SHA
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

          // Apply AI fixes to the content
          const fixedContent = await this.analyzer.fixIssues(currentContent, fileIssues);
          
          // Check if content actually changed
          if (fixedContent === currentContent) {
            console.log(`No changes needed for ${filename}`);
            continue;
          }

          console.log(`Content changed for ${filename}, applying fixes...`);

          // Create detailed commit message for this file
          const fixableIssues = fileIssues.filter(i => i.fixable);
          const commitMessage = `🤖 ReviewAI: Fix ${fixableIssues.length} issues in ${filename}

Fixed issues:
${fixableIssues.map(i => `- ${i.message} (line ${i.line})`).join('\n')}

Auto-fixed by ReviewAI`;

          // Update the file on GitHub
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
          // Continue with other files even if one fails
        }
      }

      // If we fixed issues, try to close related GitHub issues
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

  private async autoCloseRelatedIssues(owner: string, repo: string, fixedIssues: CodeIssue[]) {
    try {
      console.log(`Looking for GitHub issues to close for ${fixedIssues.length} fixed issues`);
      
      // Get all open issues from the repository
      const openIssues = await this.github.request(`/repos/${owner}/${repo}/issues?state=open&per_page=100`);
      
      console.log(`Found ${openIssues.length} open issues to check`);

      for (const issue of openIssues) {
        // Check if this is a ReviewAI-generated issue
        const isReviewAIIssue = issue.title.includes('Daily Review:') || 
                               issue.title.includes('ReviewAI') ||
                               (issue.body && (
                                 issue.body.includes('Generated by ReviewAI') || 
                                 issue.body.includes('ReviewAI daily review') ||
                                 issue.body.includes('🔍 Generated by ReviewAI')
                               ));

        if (isReviewAIIssue) {
          console.log(`Found ReviewAI issue to close: #${issue.number} - ${issue.title}`);
          
          // Create a detailed resolution comment
          const closeComment = `🤖 **ReviewAI Auto-Resolution**

This issue has been automatically resolved! The following fixes were applied:

${fixedIssues.map(issue => `- ✅ **Fixed**: ${issue.message} in \`${issue.file}:${issue.line}\``).join('\n')}

## 📊 Summary
- **${fixedIssues.length}** issues automatically fixed
- **${new Set(fixedIssues.map(i => i.file)).size}** files updated
- Code quality improvements applied
- Best practices enforced

## 🔗 Changes
The fixes have been committed to the repository. You can review the changes in the commit history.

---
*🔧 Automatically resolved by ReviewAI • [View commits](https://github.com/${owner}/${repo}/commits)*`;

          try {
            // Add the resolution comment
            await this.github.request(`/repos/${owner}/${repo}/issues/${issue.number}/comments`, {
              method: 'POST',
              body: JSON.stringify({ body: closeComment }),
            });

            // Close the issue
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
      // Don't throw - this is not critical to the fix process
    }
  }

  private generateReviewBody(issues: CodeIssue[], comments: string[]): string {
    const criticalCount = issues.filter(i => i.severity === 'high').length;
    const warningCount = issues.filter(i => i.severity === 'medium').length;
    const infoCount = issues.filter(i => i.severity === 'low').length;

    let body = '# 🤖 ReviewAI Analysis\n\n';
    
    if (issues.length === 0) {
      body += '✅ **Excellent work!** No issues found in this pull request.\n\n';
      body += 'The code looks clean and follows best practices. Ready to merge! 🚀';
    } else {
      body += `## 📊 Summary\n\n`;
      body += `Found **${issues.length} issues** that need attention:\n\n`;
      body += `| Severity | Count |\n`;
      body += `|----------|-------|\n`;
      body += `| 🔴 Critical | ${criticalCount} |\n`;
      body += `| 🟡 Warning | ${warningCount} |\n`;
      body += `| 🔵 Info | ${infoCount} |\n\n`;
      
      if (criticalCount > 0) {
        body += '⚠️ **Critical issues must be addressed before merging.**\n\n';
      }
      
      body += '## 📝 Detailed Review\n\n';
      body += comments.join('\n');
      
      body += '\n\n## 🛠️ Fix Options\n\n';
      body += '- **🤖 AI Auto-Fix**: Use ReviewAI to automatically fix these issues\n';
      body += '- **✋ Manual Fix**: Review and fix issues manually\n';
      body += '- **📋 Create Issues**: Convert findings to GitHub issues for tracking\n';
    }

    body += '\n\n---\n*🔍 Automated review by ReviewAI • [Learn more](https://github.com/reviewai)*';
    return body;
  }

  private generateIssueBody(issues: CodeIssue[]): string {
    let body = '# 🔍 Daily Main Branch Review\n\n';
    body += `Found **${issues.length} issues** that need attention:\n\n`;

    // Summary table
    const criticalCount = issues.filter(i => i.severity === 'high').length;
    const warningCount = issues.filter(i => i.severity === 'medium').length;
    const infoCount = issues.filter(i => i.severity === 'low').length;

    body += `## 📊 Summary\n\n`;
    body += `| Severity | Count |\n`;
    body += `|----------|-------|\n`;
    body += `| 🔴 Critical | ${criticalCount} |\n`;
    body += `| 🟡 Warning | ${warningCount} |\n`;
    body += `| 🔵 Info | ${infoCount} |\n\n`;

    // Issues by file
    const groupedIssues = this.groupIssuesByFile(issues);
    
    body += `## 📁 Issues by File\n\n`;
    
    Object.entries(groupedIssues).forEach(([filename, fileIssues]) => {
      body += `### ${filename}\n\n`;
      fileIssues.forEach(issue => {
        const emoji = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🔵';
        body += `${emoji} **Line ${issue.line}**: ${issue.message}\n`;
        if (issue.suggestion) {
          body += `   💡 **Fix**: ${issue.suggestion}\n`;
        }
        if (issue.originalCode && issue.suggestedCode) {
          body += '   ```diff\n';
          body += `   - ${issue.originalCode.trim()}\n`;
          body += `   + ${issue.suggestedCode.trim()}\n`;
          body += '   ```\n';
        }
        body += '\n';
      });
    });

    body += '\n## 🛠️ Fix Options\n\n';
    body += '- **🤖 AI Auto-Fix**: Use ReviewAI to automatically fix these issues\n';
    body += '- **✋ Manual Review**: Review and fix issues manually\n';
    body += '- **⚙️ Configure**: Set up automated daily reviews to catch issues early\n';

    body += '\n---\n*🔍 Generated by ReviewAI daily review • [Learn more](https://github.com/reviewai)*';
    return body;
  }

  private determineReviewEvent(issues: CodeIssue[]): 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT' {
    const criticalIssues = issues.filter(i => i.severity === 'high').length;
    
    if (criticalIssues > 0) {
      return 'REQUEST_CHANGES';
    } else if (issues.length === 0) {
      return 'APPROVE';
    } else {
      return 'COMMENT';
    }
  }

  private hasCriticalIssues(issues: CodeIssue[]): boolean {
    return issues.some(issue => issue.severity === 'high');
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