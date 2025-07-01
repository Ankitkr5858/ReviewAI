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

  async analyzeCode(fileContent: string, fileName: string, language: string): Promise<AnalysisResult> {
    try {
      const fileHash = this.generateFileHash(fileContent);
      
      // Check cache first for consistent results
      if (this.issueCache.has(fileHash)) {
        const cachedIssues = this.issueCache.get(fileHash)!;
        return {
          issues: cachedIssues,
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
      
      // Add consistent IDs and hashes
      const finalIssues = uniqueIssues.map(issue => ({
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
            severity: 'low',
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

        // TODO/FIXME comments - Make these fixable by converting to proper issues
        if (line.includes('TODO') || line.includes('FIXME')) {
          const originalCode = line;
          const todoText = line.match(/(TODO|FIXME):?\s*(.+)/i)?.[2] || 'Address this item';
          const suggestedCode = line.replace(/(TODO|FIXME):?\s*/i, `// ISSUE: ${todoText} - `);
          
          issues.push({
            type: 'info',
            severity: 'low',
            file: fileName,
            line: lineNumber,
            message: 'TODO/FIXME comment found',
            rule: 'no-todo',
            suggestion: 'Convert TODO to proper issue tracker item or address immediately',
            fixable: true,
            originalCode,
            suggestedCode,
          });
        }

        // Long lines (>120 characters) - Enhanced fixing
        if (line.length > 120) {
          const indent = line.match(/^\s*/)?.[0] || '';
          let suggestedCode = line;
          
          // Try to break at logical points
          if (line.includes('&&') || line.includes('||')) {
            const operators = line.split(/(\s+&&\s+|\s+\|\|\s+)/);
            if (operators.length > 1) {
              suggestedCode = operators[0] + '\n' + indent + '  ' + operators.slice(1).join('');
            }
          } else if (line.includes(',') && line.includes('(')) {
            // Break function parameters
            suggestedCode = line.replace(/,\s*/g, ',\n' + indent + '  ');
          } else {
            // Simple break at space
            const breakPoint = line.lastIndexOf(' ', 100);
            if (breakPoint > 0) {
              suggestedCode = line.substring(0, breakPoint) + '\n' + indent + '  ' + line.substring(breakPoint + 1);
            }
          }

          issues.push({
            type: 'info',
            severity: 'low',
            file: fileName,
            line: lineNumber,
            message: `Line too long (${line.length} characters, max 120)`,
            rule: 'max-len',
            suggestion: 'Break long lines for better readability',
            fixable: true,
            originalCode: line,
            suggestedCode,
          });
        }

        // Missing semicolons
        if (this.shouldHaveSemicolon(trimmedLine) && !trimmedLine.endsWith(';')) {
          const suggestedCode = line + ';';
          
          issues.push({
            type: 'error',
            severity: 'medium',
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

        // Missing error handling for async/await
        if (line.includes('await ') && !this.hasErrorHandling(lines, index)) {
          const indent = line.match(/^\s*/)?.[0] || '';
          const awaitLine = line.trim();
          const suggestedCode = `${indent}try {\n${line}\n${indent}} catch (error) {\n${indent}  console.error('Error:', error);\n${indent}}`;
          
          issues.push({
            type: 'warning',
            severity: 'medium',
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

        // Hardcoded strings that should be constants - Enhanced fixing
        const stringMatch = line.match(/"([^"]{10,})"/g);
        if (stringMatch && !line.includes('console.log') && !line.includes('import') && !line.includes('require')) {
          const longString = stringMatch[0];
          const constantName = this.generateConstantName(longString);
          const suggestedCode = line.replace(longString, constantName);
          
          issues.push({
            type: 'info',
            severity: 'low',
            file: fileName,
            line: lineNumber,
            message: 'Consider extracting long string to a constant',
            rule: 'no-hardcoded-strings',
            suggestion: `Extract to: const ${constantName} = ${longString};`,
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
            severity: 'medium',
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

        // Missing const for variables that are never reassigned
        const letMatch = trimmedLine.match(/^let\s+(\w+)\s*=\s*(.+);?$/);
        if (letMatch) {
          const varName = letMatch[1];
          const restOfFile = lines.slice(index + 1).join('\n');
          // Simple check: if variable is not reassigned (no "varName =")
          if (!restOfFile.includes(`${varName} =`) && !restOfFile.includes(`${varName}++`) && !restOfFile.includes(`${varName}--`)) {
            const suggestedCode = line.replace(/^(\s*)let\s+/, '$1const ');
            
            issues.push({
              type: 'info',
              severity: 'low',
              file: fileName,
              line: lineNumber,
              message: `Variable '${varName}' is never reassigned, use 'const' instead of 'let'`,
              rule: 'prefer-const',
              suggestion: 'Use const for variables that are never reassigned',
              fixable: true,
              originalCode: line,
              suggestedCode,
            });
          }
        }

        // Function expressions that could be arrow functions
        const funcMatch = trimmedLine.match(/^(\s*)(const|let|var)\s+(\w+)\s*=\s*function\s*\(([^)]*)\)\s*\{/);
        if (funcMatch) {
          const [, indent, keyword, funcName, params] = funcMatch;
          const suggestedCode = `${indent}${keyword} ${funcName} = (${params}) => {`;
          
          issues.push({
            type: 'info',
            severity: 'low',
            file: fileName,
            line: lineNumber,
            message: 'Function expression can be converted to arrow function',
            rule: 'prefer-arrow-callback',
            suggestion: 'Use arrow functions for better readability',
            fixable: true,
            originalCode: line,
            suggestedCode,
          });
        }

        // Missing JSDoc for functions
        if (trimmedLine.match(/^(export\s+)?(async\s+)?function\s+\w+/) || trimmedLine.match(/^(export\s+)?(const|let)\s+\w+\s*=\s*(async\s+)?\(/)) {
          const prevLine = index > 0 ? lines[index - 1].trim() : '';
          if (!prevLine.startsWith('/**') && !prevLine.startsWith('//')) {
            const indent = line.match(/^\s*/)?.[0] || '';
            const funcName = line.match(/function\s+(\w+)|(\w+)\s*=/)?.[1] || 'function';
            const suggestedCode = `${indent}/**\n${indent} * ${funcName} description\n${indent} */\n${line}`;
            
            issues.push({
              type: 'info',
              severity: 'low',
              file: fileName,
              line: lineNumber,
              message: 'Function missing JSDoc documentation',
              rule: 'require-jsdoc',
              suggestion: 'Add JSDoc comments for better documentation',
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

      // Performance issues
      if (line.includes('document.getElementById') && lines.filter(l => l.includes('document.getElementById')).length > 3) {
        const elementId = line.match(/getElementById\(['"]([^'"]+)['"]\)/)?.[1];
        if (elementId) {
          const suggestedCode = line.replace(/document\.getElementById\(['"]([^'"]+)['"]\)/, `this.${elementId}Element || (this.${elementId}Element = document.getElementById('${elementId}'))`);
          
          issues.push({
            type: 'info',
            severity: 'low',
            file: fileName,
            line: lineNumber,
            message: 'Multiple DOM queries detected - consider caching',
            rule: 'cache-dom-queries',
            suggestion: 'Cache DOM element references to improve performance',
            fixable: true,
            originalCode: line,
            suggestedCode,
          });
        }
      }
    });

    return issues;
  }

  private generateConstantName(str: string): string {
    // Extract meaningful words from string and create constant name
    const cleaned = str.replace(/['"]/g, '').replace(/[^a-zA-Z0-9\s]/g, ' ');
    const words = cleaned.split(/\s+/).filter(w => w.length > 2).slice(0, 3);
    return words.length > 0 
      ? words.map(w => w.toUpperCase()).join('_') + '_TEXT'
      : 'CONSTANT_TEXT';
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