export interface CodeIssue {
  type: 'error' | 'warning' | 'info';
  severity: 'high' | 'medium' | 'low';
  file: string;
  line: number;
  column?: number;
  message: string;
  rule?: string;
  suggestion?: string;
  fixable?: boolean;
  originalCode?: string;
  suggestedCode?: string;
  id?: string;
  hash?: string; // Add hash for consistent issue tracking
}

export interface AnalysisResult {
  issues: CodeIssue[];
  metrics: {
    complexity: number;
    maintainability: number;
    testCoverage?: number;
  };
  suggestions: string[];
  fileHash?: string; // Track file content hash
}

export class CodeAnalysisService {
  private openaiApiKey: string;
  private issueCache: Map<string, CodeIssue[]> = new Map(); // Cache issues by file hash

  constructor(openaiApiKey: string) {
    this.openaiApiKey = openaiApiKey;
  }

  // Generate hash for file content to ensure consistent analysis
  private generateFileHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Generate consistent issue hash for tracking
  private generateIssueHash(issue: Omit<CodeIssue, 'id' | 'hash'>): string {
    const key = `${issue.file}:${issue.line}:${issue.rule || issue.type}:${issue.message}`;
    return this.generateFileHash(key);
  }

  // NEW: Analyze only specific changed lines in a file (for PR reviews)
  async analyzeChangedLines(fileContent: string, fileName: string, language: string, changedLines: number[]): Promise<AnalysisResult> {
    try {
      console.log(`Analyzing ${changedLines.length} changed lines in ${fileName}`);
      
      if (changedLines.length === 0) {
        return {
          issues: [],
          metrics: { complexity: 0, maintainability: 100 },
          suggestions: [],
        };
      }

      // Perform static analysis only on changed lines
      const staticIssues = this.performStaticAnalysisOnLines(fileContent, fileName, language, changedLines);
      
      // Filter out info-level issues immediately
      const filteredIssues = staticIssues.filter(issue => 
        issue.severity === 'high' || issue.severity === 'medium'
      );
      
      // Add consistent IDs and hashes
      const finalIssues = filteredIssues.map(issue => ({
        ...issue,
        hash: this.generateIssueHash(issue),
        id: this.generateIssueId(issue)
      }));

      console.log(`Found ${finalIssues.length} critical/warning issues in changed lines`);
      
      return {
        issues: finalIssues,
        metrics: { complexity: 1, maintainability: 90 },
        suggestions: finalIssues.length > 0 ? ['Review and fix the identified issues in your changes'] : [],
      };
    } catch (error) {
      console.error('Changed lines analysis failed:', error);
      return {
        issues: [],
        metrics: { complexity: 0, maintainability: 0 },
        suggestions: [],
      };
    }
  }

  async analyzeCode(fileContent: string, fileName: string, language: string): Promise<AnalysisResult> {
    try {
      const fileHash = this.generateFileHash(fileContent);
      
      // Check cache first for consistent results
      if (this.issueCache.has(fileHash)) {
        const cachedIssues = this.issueCache.get(fileHash)!;
        // Filter out info issues from cached results too
        const filteredCached = cachedIssues.filter(issue => 
          issue.severity === 'high' || issue.severity === 'medium'
        );
        return {
          issues: filteredCached,
          metrics: { complexity: 2, maintainability: 85 },
          suggestions: ['Consider adding unit tests', 'Review code documentation'],
          fileHash
        };
      }

      // Perform comprehensive static analysis
      const staticIssues = this.performStaticAnalysis(fileContent, fileName, language);
      
      // AI-powered analysis for complex issues
      const aiAnalysis = await this.performAIAnalysis(fileContent, fileName, language);
      
      // Combine and deduplicate issues
      const allIssues = [...staticIssues, ...aiAnalysis.issues];
      const uniqueIssues = this.deduplicateIssues(allIssues);
      
      // CRITICAL: Filter out info-level issues
      const filteredIssues = uniqueIssues.filter(issue => 
        issue.severity === 'high' || issue.severity === 'medium'
      );
      
      // Add consistent IDs and hashes
      const finalIssues = filteredIssues.map(issue => ({
        ...issue,
        hash: this.generateIssueHash(issue),
        id: this.generateIssueId(issue)
      }));

      // Cache results for consistency
      this.issueCache.set(fileHash, finalIssues);
      
      return {
        issues: finalIssues,
        metrics: aiAnalysis.metrics,
        suggestions: aiAnalysis.suggestions,
        fileHash
      };
    } catch (error) {
      console.error('Code analysis failed:', error);
      return {
        issues: [],
        metrics: { complexity: 0, maintainability: 0 },
        suggestions: [],
      };
    }
  }

  // NEW: Analyze only specific lines (for PR changed lines)
  private performStaticAnalysisOnLines(content: string, fileName: string, language: string, targetLines: number[]): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');
    const targetLineSet = new Set(targetLines);

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // CRITICAL: Only analyze lines that were changed in the PR
      if (!targetLineSet.has(lineNumber)) {
        return;
      }
      
      const trimmedLine = line.trim();
      
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*')) {
        return;
      }
      
      if (language === 'javascript' || language === 'typescript') {
        // Console.log detection - HIGH PRIORITY FOR PRODUCTION CODE
        if (line.includes('console.log') && !line.includes('//')) {
          const originalCode = line;
          const suggestedCode = line.replace(/console\.log\([^)]*\);?/, '// TODO: Remove console.log for production');
          
          issues.push({
            type: 'warning',
            severity: 'medium', // Upgraded from low to medium for production readiness
            file: fileName,
            line: lineNumber,
            message: 'Console.log statement should be removed for production',
            rule: 'no-console',
            suggestion: 'Remove console.log statements or use proper logging library',
            fixable: true,
            originalCode,
            suggestedCode,
          });
        }

        // Missing semicolons - CRITICAL FOR CODE CONSISTENCY
        if (this.shouldHaveSemicolon(trimmedLine) && !trimmedLine.endsWith(';')) {
          const suggestedCode = line + ';';
          
          issues.push({
            type: 'error',
            severity: 'high', // Upgraded to high for consistency
            file: fileName,
            line: lineNumber,
            message: 'Missing semicolon',
            rule: 'semi',
            suggestion: 'Add semicolon at end of statement',
            fixable: true,
            originalCode: line,
            suggestedCode,
          });
        }

        // Double equals instead of triple equals - CRITICAL FOR TYPE SAFETY
        if (line.includes('==') && !line.includes('===') && !line.includes('!==')) {
          const suggestedCode = line.replace(/([^=!])={2}([^=])/g, '$1===$2').replace(/!={2}([^=])/g, '!==$1');
          
          issues.push({
            type: 'warning',
            severity: 'high', // Upgraded to high for type safety
            file: fileName,
            line: lineNumber,
            message: 'Use strict equality (===) instead of loose equality (==)',
            rule: 'eqeqeq',
            suggestion: 'Use === and !== for strict equality checks',
            fixable: true,
            originalCode: line,
            suggestedCode,
          });
        }

        // Missing error handling for async/await - CRITICAL FOR RELIABILITY
        if (line.includes('await ') && !this.hasErrorHandling(lines, index)) {
          const indent = line.match(/^\s*/)?.[0] || '';
          const awaitLine = line.trim();
          const suggestedCode = `${indent}try {\n${line}\n${indent}} catch (error) {\n${indent}  console.error('Error:', error);\n${indent}}`;
          
          issues.push({
            type: 'warning',
            severity: 'high', // Upgraded to high for reliability
            file: fileName,
            line: lineNumber,
            message: 'Async operation without error handling',
            rule: 'require-await-error-handling',
            suggestion: 'Wrap await calls in try-catch blocks',
            fixable: true,
            originalCode: line,
            suggestedCode,
          });
        }

        // Unused variables (basic detection) - MEDIUM PRIORITY
        const varMatch = trimmedLine.match(/^(let|const|var)\s+(\w+)/);
        if (varMatch) {
          const varName = varMatch[2];
          const restOfFile = lines.slice(index + 1).join('\n');
          if (!restOfFile.includes(varName) && varName !== '_') {
            const suggestedCode = line.replace(varName, `_${varName}`);
            
            issues.push({
              type: 'warning',
              severity: 'medium',
              file: fileName,
              line: lineNumber,
              message: `Variable '${varName}' is declared but never used`,
              rule: 'no-unused-vars',
              suggestion: `Prefix with underscore to indicate intentional non-use`,
              fixable: true,
              originalCode: line,
              suggestedCode,
            });
          }
        }
      }

      // Security issues - ALWAYS HIGH PRIORITY
      if (line.includes('eval(')) {
        issues.push({
          type: 'error',
          severity: 'high',
          file: fileName,
          line: lineNumber,
          message: 'Use of eval() is dangerous and should be avoided',
          rule: 'no-eval',
          suggestion: 'Replace eval() with safer alternatives like JSON.parse() or proper function calls',
          fixable: false, // Too complex to auto-fix safely
          originalCode: line,
        });
      }

      if (line.includes('innerHTML') && line.includes('=')) {
        const suggestedCode = line.replace(/\.innerHTML\s*=/, '.textContent =');
        
        issues.push({
          type: 'error',
          severity: 'high',
          file: fileName,
          line: lineNumber,
          message: 'Potential XSS vulnerability with innerHTML',
          rule: 'no-inner-html',
          suggestion: 'Use textContent or sanitize HTML content before setting innerHTML',
          fixable: true,
          originalCode: line,
          suggestedCode,
        });
      }
    });

    console.log(`Found ${issues.length} issues in ${targetLines.length} changed lines`);
    return issues;
  }

  private deduplicateIssues(issues: CodeIssue[]): CodeIssue[] {
    const seen = new Set<string>();
    return issues.filter(issue => {
      const key = `${issue.file}:${issue.line}:${issue.rule || issue.type}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private generateIssueId(issue: CodeIssue): string {
    return `${issue.file}:${issue.line}:${issue.rule || issue.type}:${Date.now()}`;
  }

  private performStaticAnalysis(content: string, fileName: string, language: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();
      
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*')) {
        return;
      }
      
      if (language === 'javascript' || language === 'typescript') {
        // Console.log detection
        if (line.includes('console.log') && !line.includes('//')) {
          const originalCode = line;
          const suggestedCode = line.replace(/console\.log\([^)]*\);?/, '// TODO: Remove console.log for production');
          
          issues.push({
            type: 'warning',
            severity: 'medium', // Upgraded from low
            file: fileName,
            line: lineNumber,
            message: 'Console.log statement should be removed for production',
            rule: 'no-console',
            suggestion: 'Remove console.log statements or use proper logging library',
            fixable: true,
            originalCode,
            suggestedCode,
          });
        }

        // Missing semicolons
        if (this.shouldHaveSemicolon(trimmedLine) && !trimmedLine.endsWith(';')) {
          const suggestedCode = line + ';';
          
          issues.push({
            type: 'error',
            severity: 'high', // Upgraded to high
            file: fileName,
            line: lineNumber,
            message: 'Missing semicolon',
            rule: 'semi',
            suggestion: 'Add semicolon at end of statement',
            fixable: true,
            originalCode: line,
            suggestedCode,
          });
        }

        // Double equals instead of triple equals
        if (line.includes('==') && !line.includes('===') && !line.includes('!==')) {
          const suggestedCode = line.replace(/([^=!])={2}([^=])/g, '$1===$2').replace(/!={2}([^=])/g, '!==$1');
          
          issues.push({
            type: 'warning',
            severity: 'high', // Upgraded to high
            file: fileName,
            line: lineNumber,
            message: 'Use strict equality (===) instead of loose equality (==)',
            rule: 'eqeqeq',
            suggestion: 'Use === and !== for strict equality checks',
            fixable: true,
            originalCode: line,
            suggestedCode,
          });
        }

        // Missing error handling for async/await
        if (line.includes('await ') && !this.hasErrorHandling(lines, index)) {
          const indent = line.match(/^\s*/)?.[0] || '';
          const awaitLine = line.trim();
          const suggestedCode = `${indent}try {\n${line}\n${indent}} catch (error) {\n${indent}  console.error('Error:', error);\n${indent}}`;
          
          issues.push({
            type: 'warning',
            severity: 'high', // Upgraded to high
            file: fileName,
            line: lineNumber,
            message: 'Async operation without error handling',
            rule: 'require-await-error-handling',
            suggestion: 'Wrap await calls in try-catch blocks',
            fixable: true,
            originalCode: line,
            suggestedCode,
          });
        }

        // Unused variables (basic detection)
        const varMatch = trimmedLine.match(/^(let|const|var)\s+(\w+)/);
        if (varMatch) {
          const varName = varMatch[2];
          const restOfFile = lines.slice(index + 1).join('\n');
          if (!restOfFile.includes(varName) && varName !== '_') {
            const suggestedCode = line.replace(varName, `_${varName}`);
            
            issues.push({
              type: 'warning',
              severity: 'medium',
              file: fileName,
              line: lineNumber,
              message: `Variable '${varName}' is declared but never used`,
              rule: 'no-unused-vars',
              suggestion: `Prefix with underscore to indicate intentional non-use`,
              fixable: true,
              originalCode: line,
              suggestedCode,
            });
          }
        }
      }

      // Security issues
      if (line.includes('eval(')) {
        issues.push({
          type: 'error',
          severity: 'high',
          file: fileName,
          line: lineNumber,
          message: 'Use of eval() is dangerous and should be avoided',
          rule: 'no-eval',
          suggestion: 'Replace eval() with safer alternatives like JSON.parse() or proper function calls',
          fixable: false, // Too complex to auto-fix safely
          originalCode: line,
        });
      }

      if (line.includes('innerHTML') && line.includes('=')) {
        const suggestedCode = line.replace(/\.innerHTML\s*=/, '.textContent =');
        
        issues.push({
          type: 'error',
          severity: 'high',
          file: fileName,
          line: lineNumber,
          message: 'Potential XSS vulnerability with innerHTML',
          rule: 'no-inner-html',
          suggestion: 'Use textContent or sanitize HTML content before setting innerHTML',
          fixable: true,
          originalCode: line,
          suggestedCode,
        });
      }
    });

    return issues;
  }

  private shouldHaveSemicolon(line: string): boolean {
    // More accurate semicolon detection
    const needsSemicolonPatterns = [
      /^(let|const|var)\s+\w+.*[^{};]$/, // Variable declarations
      /^return\s+.*[^{};]$/, // Return statements
      /^throw\s+.*[^{};]$/, // Throw statements
      /^import\s+.*[^{};]$/, // Import statements
      /^export\s+.*[^{};]$/, // Export statements (not default)
      /\w+\([^)]*\)\s*$/, // Function calls
      /^\w+\s*=\s*.*[^{};]$/, // Assignments
    ];

    const noSemicolonPatterns = [
      /^(if|for|while|switch|try|catch|finally|function|class)\s*[\(\{]/, // Control structures
      /^\s*[{}]\s*$/, // Braces only
      /^\/\//, // Comments
      /^\/\*/, // Block comments
      /^export\s+default\s+/, // Export default
    ];

    // Check exclusions first
    for (const pattern of noSemicolonPatterns) {
      if (pattern.test(line)) return false;
    }

    // Check inclusions
    for (const pattern of needsSemicolonPatterns) {
      if (pattern.test(line)) return true;
    }

    return false;
  }

  private hasErrorHandling(lines: string[], currentIndex: number): boolean {
    // Look for try-catch blocks around the current line
    const searchRange = 10; // Look 10 lines up and down
    const start = Math.max(0, currentIndex - searchRange);
    const end = Math.min(lines.length, currentIndex + searchRange);
    
    for (let i = start; i < end; i++) {
      const line = lines[i].trim();
      if (line.includes('try {') || line.includes('catch') || line.includes('.catch(')) {
        return true;
      }
    }
    return false;
  }

  private async performAIAnalysis(content: string, fileName: string, language: string): Promise<AnalysisResult> {
    // Simplified AI analysis for consistency
    try {
      // For demo purposes, return consistent analysis based on content patterns
      const lines = content.split('\n');
      const complexity = Math.min(10, Math.max(1, Math.floor(lines.length / 20)));
      const maintainability = Math.max(60, 100 - (lines.length / 10));

      return {
        issues: [], // Static analysis covers most issues
        metrics: { complexity, maintainability },
        suggestions: [
          'Consider adding unit tests for better code coverage',
          'Review function complexity and consider breaking down large functions',
          'Add JSDoc comments for better documentation'
        ],
      };
    } catch (error) {
      console.error('AI analysis failed:', error);
      return {
        issues: [],
        metrics: { complexity: 1, maintainability: 80 },
        suggestions: [],
      };
    }
  }

  async fixIssues(content: string, issues: CodeIssue[]): Promise<string> {
    const fixableIssues = issues.filter(issue => issue.fixable && issue.suggestedCode);
    
    if (fixableIssues.length === 0) {
      console.log('No fixable issues found');
      return content;
    }

    console.log(`Fixing ${fixableIssues.length} issues`);
    
    let fixedContent = content;
    const lines = fixedContent.split('\n');

    // Sort issues by line number in descending order to avoid line number shifts
    fixableIssues.sort((a, b) => b.line - a.line);

    let appliedFixes = 0;
    
    fixableIssues.forEach(issue => {
      const lineIndex = issue.line - 1;
      if (lineIndex >= 0 && lineIndex < lines.length && issue.suggestedCode) {
        const originalLine = lines[lineIndex];
        
        // Verify the original code matches (basic check)
        if (issue.originalCode && originalLine.trim() === issue.originalCode.trim()) {
          // Handle multi-line fixes
          if (issue.suggestedCode.includes('\n')) {
            const newLines = issue.suggestedCode.split('\n');
            lines.splice(lineIndex, 1, ...newLines);
          } else {
            lines[lineIndex] = issue.suggestedCode;
          }
          appliedFixes++;
          console.log(`✅ Fixed: ${issue.message} at line ${issue.line}`);
        } else {
          console.log(`⚠️ Skipped: ${issue.message} at line ${issue.line} (content mismatch)`);
        }
      }
    });

    console.log(`Applied ${appliedFixes} out of ${fixableIssues.length} fixes`);
    return lines.join('\n');
  }

  // Clear cache when needed (e.g., when file is updated)
  clearCache(fileHash?: string) {
    if (fileHash) {
      this.issueCache.delete(fileHash);
    } else {
      this.issueCache.clear();
    }
  }

  // Method to check if an issue still exists in the current code
  async validateIssue(content: string, issue: CodeIssue): Promise<boolean> {
    const currentHash = this.generateFileHash(content);
    const issueHash = this.generateIssueHash(issue);
    
    // If file hasn't changed, issue status is the same
    if (this.issueCache.has(currentHash)) {
      const cachedIssues = this.issueCache.get(currentHash)!;
      return cachedIssues.some(i => i.hash === issueHash);
    }

    // Re-analyze if file changed
    const analysis = await this.analyzeCode(content, issue.file, 'typescript');
    return analysis.issues.some(i => i.hash === issueHash);
  }
}