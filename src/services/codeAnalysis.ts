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
  hash?: string;
  category?: 'prettier' | 'eslint' | 'security' | 'performance' | 'best-practice';
}

export interface AnalysisResult {
  issues: CodeIssue[];
  metrics: {
    complexity: number;
    maintainability: number;
    testCoverage?: number;
    performanceScore?: number; // NEW: Performance score
  };
  suggestions: string[];
  fileHash?: string;
  hasConflicts?: boolean;
  conflictDetails?: {
    conflictMarkers: number;
    conflictFiles: string[];
    canAutoResolve: boolean;
  };
}

export class CodeAnalysisService {
  private openaiApiKey: string;
  private issueCache: Map<string, CodeIssue[]> = new Map();

  constructor(openaiApiKey: string) {
    this.openaiApiKey = openaiApiKey;
  }

  private generateFileHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private generateIssueHash(issue: Omit<CodeIssue, 'id' | 'hash'>): string {
    const key = `${issue.file}:${issue.line}:${issue.rule || issue.type}:${issue.message}`;
    return this.generateFileHash(key);
  }

  checkForConflicts(fileContent: string): { hasConflicts: boolean; conflictDetails?: any } {
    const conflictMarkers = [
      /^<{7}\s/gm,
      /^={7}$/gm,
      /^>{7}\s/gm
    ];

    let totalConflicts = 0;
    const conflictLines: number[] = [];
    const lines = fileContent.split('\n');

    lines.forEach((line, index) => {
      conflictMarkers.forEach(marker => {
        if (marker.test(line)) {
          totalConflicts++;
          conflictLines.push(index + 1);
        }
      });
    });

    const hasConflicts = totalConflicts > 0;

    if (hasConflicts) {
      return {
        hasConflicts: true,
        conflictDetails: {
          conflictMarkers: totalConflicts,
          conflictLines,
          canAutoResolve: this.canAutoResolveConflicts(fileContent),
          conflictSections: this.extractConflictSections(fileContent)
        }
      };
    }

    return { hasConflicts: false };
  }

  private extractConflictSections(content: string) {
    const sections = [];
    const lines = content.split('\n');
    let inConflict = false;
    let currentConflict: any = null;

    lines.forEach((line, index) => {
      if (/^<{7}\s/.test(line)) {
        inConflict = true;
        currentConflict = {
          startLine: index + 1,
          headBranch: line.replace(/^<{7}\s/, ''),
          headContent: [],
          baseContent: [],
          inBase: false
        };
      } else if (/^={7}$/.test(line) && inConflict) {
        currentConflict.inBase = true;
      } else if (/^>{7}\s/.test(line) && inConflict) {
        currentConflict.endLine = index + 1;
        currentConflict.mergeBranch = line.replace(/^>{7}\s/, '');
        sections.push(currentConflict);
        inConflict = false;
        currentConflict = null;
      } else if (inConflict && currentConflict) {
        if (currentConflict.inBase) {
          currentConflict.baseContent.push(line);
        } else {
          currentConflict.headContent.push(line);
        }
      }
    });

    return sections;
  }

  private canAutoResolveConflicts(content: string): boolean {
    const conflictSections = this.extractConflictSections(content);
    
    return conflictSections.every(section => {
      const headEmpty = section.headContent.every((line: string) => line.trim() === '');
      const baseEmpty = section.baseContent.every((line: string) => line.trim() === '');
      
      if (headEmpty || baseEmpty) return true;
      
      const headNormalized = section.headContent.join('').replace(/\s+/g, '');
      const baseNormalized = section.baseContent.join('').replace(/\s+/g, '');
      
      return headNormalized === baseNormalized;
    });
  }

  async autoResolveConflicts(fileContent: string, fileName: string): Promise<string> {
    const conflictCheck = this.checkForConflicts(fileContent);
    
    if (!conflictCheck.hasConflicts) {
      return fileContent;
    }

    console.log(`🔧 Auto-resolving conflicts in ${fileName}...`);
    
    const conflictSections = conflictCheck.conflictDetails?.conflictSections || [];
    let resolvedContent = fileContent;

    for (const section of conflictSections) {
      const conflictBlock = `<<<<<<< ${section.headBranch}\n${section.headContent.join('\n')}\n=======\n${section.baseContent.join('\n')}\n>>>>>>> ${section.mergeBranch}`;
      
      let resolution = '';
      
      const headEmpty = section.headContent.every((line: string) => line.trim() === '');
      const baseEmpty = section.baseContent.every((line: string) => line.trim() === '');
      
      if (headEmpty && !baseEmpty) {
        resolution = section.baseContent.join('\n');
      } else if (baseEmpty && !headEmpty) {
        resolution = section.headContent.join('\n');
      } else {
        resolution = this.intelligentMerge(section.headContent, section.baseContent);
      }
      
      resolvedContent = resolvedContent.replace(conflictBlock, resolution);
    }

    console.log(`✅ Resolved ${conflictSections.length} conflicts in ${fileName}`);
    return resolvedContent;
  }

  private intelligentMerge(headContent: string[], baseContent: string[]): string {
    const headNormalized = headContent.join('').replace(/\s+/g, '');
    const baseNormalized = baseContent.join('').replace(/\s+/g, '');
    
    if (headNormalized === baseNormalized) {
      return headContent.join('\n');
    }
    
    return [
      '// Merged from both branches:',
      ...headContent,
      '// Additional changes:',
      ...baseContent.filter(line => !headContent.includes(line))
    ].join('\n');
  }

  async analyzeChangedLines(fileContent: string, fileName: string, language: string, changedLines: number[]): Promise<AnalysisResult> {
    try {
      console.log(`Analyzing ${changedLines.length} changed lines in ${fileName}`);
      
      if (changedLines.length === 0) {
        return {
          issues: [],
          metrics: { complexity: 0, maintainability: 100, performanceScore: 100 },
          suggestions: [],
        };
      }

      const staticIssues = this.performStaticAnalysisOnLines(fileContent, fileName, language, changedLines);
      const performanceIssues = this.analyzePerformanceOnLines(fileContent, fileName, language, changedLines);
      const securityIssues = this.analyzeSecurityOnLines(fileContent, fileName, language, changedLines);
      
      const allIssues = [...staticIssues, ...performanceIssues, ...securityIssues];
      
      const filteredIssues = allIssues.filter(issue => 
        issue.severity === 'high' || issue.severity === 'medium'
      );
      
      const finalIssues = filteredIssues.map(issue => ({
        ...issue,
        hash: this.generateIssueHash(issue),
        id: this.generateIssueId(issue)
      }));

      console.log(`Found ${finalIssues.length} critical/warning issues in changed lines`);
      
      // Calculate performance score
      const performanceScore = this.calculatePerformanceScore(allIssues);
      
      return {
        issues: finalIssues,
        metrics: { complexity: 1, maintainability: 90, performanceScore },
        suggestions: finalIssues.length > 0 ? ['Review and fix the identified issues in your changes'] : [],
      };
    } catch (error) {
      console.error('Changed lines analysis failed:', error);
      return {
        issues: [],
        metrics: { complexity: 0, maintainability: 0, performanceScore: 0 },
        suggestions: [],
      };
    }
  }

  // NEW: Performance analysis for specific lines
  private analyzePerformanceOnLines(content: string, fileName: string, language: string, targetLines: number[]): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');
    const targetLineSet = new Set(targetLines);

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      if (!targetLineSet.has(lineNumber)) {
        return;
      }
      
      const trimmedLine = line.trim();
      
      if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) {
        return;
      }
      
      if (language === 'javascript' || language === 'typescript') {
        // Inefficient loops
        if (/for\s*\(\s*let\s+\w+\s*=\s*0.*\.length/.test(line)) {
          const suggestedCode = line.replace(/for\s*\(\s*let\s+(\w+)\s*=\s*0;\s*\1\s*<\s*([^;]+)\.length;\s*\1\+\+\s*\)/, 
            'for (let $1 = 0, len = $2.length; $1 < len; $1++)');
          
          issues.push({
            type: 'warning',
            severity: 'medium',
            file: fileName,
            line: lineNumber,
            message: 'Inefficient loop: accessing .length property in each iteration',
            rule: 'performance/loop-optimization',
            category: 'performance',
            suggestion: 'Cache array length to avoid repeated property access',
            fixable: true,
            originalCode: line,
            suggestedCode,
          });
        }

        // Inefficient DOM queries
        if (line.includes('document.getElementById') || line.includes('document.querySelector')) {
          if (lines.slice(Math.max(0, index - 5), index + 5).filter(l => 
            l.includes('document.getElementById') || l.includes('document.querySelector')).length > 1) {
            
            issues.push({
              type: 'warning',
              severity: 'medium',
              file: fileName,
              line: lineNumber,
              message: 'Multiple DOM queries detected - consider caching DOM elements',
              rule: 'performance/dom-caching',
              category: 'performance',
              suggestion: 'Cache DOM elements in variables to avoid repeated queries',
              fixable: false,
              originalCode: line,
            });
          }
        }

        // Inefficient array methods
        if (line.includes('.forEach(') && line.includes('push(')) {
          const suggestedCode = line.replace(/\.forEach\(/, '.map(');
          
          issues.push({
            type: 'warning',
            severity: 'medium',
            file: fileName,
            line: lineNumber,
            message: 'Consider using .map() instead of .forEach() with push()',
            rule: 'performance/prefer-map',
            category: 'performance',
            suggestion: 'Use .map() for transforming arrays instead of forEach with push',
            fixable: true,
            originalCode: line,
            suggestedCode,
          });
        }

        // Large object creation in loops
        if ((line.includes('for ') || line.includes('while ')) && 
            (line.includes('new ') || line.includes('{}') || line.includes('[]'))) {
          
          issues.push({
            type: 'warning',
            severity: 'high',
            file: fileName,
            line: lineNumber,
            message: 'Object creation inside loop can cause performance issues',
            rule: 'performance/no-object-creation-in-loop',
            category: 'performance',
            suggestion: 'Move object creation outside the loop or use object pooling',
            fixable: false,
            originalCode: line,
          });
        }

        // Synchronous operations that could be async
        if (line.includes('JSON.parse') && line.includes('localStorage.getItem')) {
          issues.push({
            type: 'warning',
            severity: 'medium',
            file: fileName,
            line: lineNumber,
            message: 'Large JSON parsing can block the main thread',
            rule: 'performance/async-json-parse',
            category: 'performance',
            suggestion: 'Consider using Web Workers for large JSON parsing operations',
            fixable: false,
            originalCode: line,
          });
        }
      }
    });

    return issues;
  }

  // NEW: Enhanced security analysis for specific lines
  private analyzeSecurityOnLines(content: string, fileName: string, language: string, targetLines: number[]): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');
    const targetLineSet = new Set(targetLines);

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      if (!targetLineSet.has(lineNumber)) {
        return;
      }
      
      const trimmedLine = line.trim();
      
      if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) {
        return;
      }
      
      if (language === 'javascript' || language === 'typescript') {
        // SQL Injection vulnerabilities
        if (line.includes('query') && line.includes('+') && (line.includes('SELECT') || line.includes('INSERT') || line.includes('UPDATE'))) {
          issues.push({
            type: 'error',
            severity: 'high',
            file: fileName,
            line: lineNumber,
            message: 'Potential SQL injection vulnerability - avoid string concatenation in SQL queries',
            rule: 'security/no-sql-injection',
            category: 'security',
            suggestion: 'Use parameterized queries or prepared statements',
            fixable: false,
            originalCode: line,
          });
        }

        // XSS vulnerabilities
        if (line.includes('innerHTML') && (line.includes('+') || line.includes('${') || line.includes('req.') || line.includes('input'))) {
          const suggestedCode = line.replace(/\.innerHTML\s*=/, '.textContent =');
          
          issues.push({
            type: 'error',
            severity: 'high',
            file: fileName,
            line: lineNumber,
            message: 'Potential XSS vulnerability - avoid setting innerHTML with user input',
            rule: 'security/no-xss',
            category: 'security',
            suggestion: 'Use textContent or sanitize HTML content with DOMPurify',
            fixable: true,
            originalCode: line,
            suggestedCode,
          });
        }

        // Insecure random number generation
        if (line.includes('Math.random()') && (line.includes('password') || line.includes('token') || line.includes('secret'))) {
          issues.push({
            type: 'error',
            severity: 'high',
            file: fileName,
            line: lineNumber,
            message: 'Insecure random number generation for security-sensitive operations',
            rule: 'security/secure-random',
            category: 'security',
            suggestion: 'Use crypto.getRandomValues() for cryptographically secure random numbers',
            fixable: false,
            originalCode: line,
          });
        }

        // Hardcoded secrets
        const secretPatterns = [
          /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i,
          /password\s*[:=]\s*['"][^'"]+['"]/i,
          /secret\s*[:=]\s*['"][^'"]+['"]/i,
          /token\s*[:=]\s*['"][^'"]+['"]/i,
        ];

        secretPatterns.forEach(pattern => {
          if (pattern.test(line)) {
            issues.push({
              type: 'error',
              severity: 'high',
              file: fileName,
              line: lineNumber,
              message: 'Hardcoded secret detected - move to environment variables',
              rule: 'security/no-hardcoded-secrets',
              category: 'security',
              suggestion: 'Use environment variables or secure configuration management',
              fixable: false,
              originalCode: line,
            });
          }
        });

        // Unsafe eval-like functions
        if (line.includes('Function(') || line.includes('setTimeout(') && line.includes('"')) {
          issues.push({
            type: 'error',
            severity: 'high',
            file: fileName,
            line: lineNumber,
            message: 'Unsafe code execution - avoid Function constructor and string-based setTimeout',
            rule: 'security/no-unsafe-eval',
            category: 'security',
            suggestion: 'Use proper function references instead of string-based code execution',
            fixable: false,
            originalCode: line,
          });
        }

        // Insecure HTTP requests
        if (line.includes('http://') && !line.includes('localhost') && !line.includes('127.0.0.1')) {
          const suggestedCode = line.replace(/http:\/\//g, 'https://');
          
          issues.push({
            type: 'warning',
            severity: 'medium',
            file: fileName,
            line: lineNumber,
            message: 'Insecure HTTP connection - use HTTPS for external requests',
            rule: 'security/enforce-https',
            category: 'security',
            suggestion: 'Use HTTPS to encrypt data in transit',
            fixable: true,
            originalCode: line,
            suggestedCode,
          });
        }
      }
    });

    return issues;
  }

  // NEW: Calculate performance score based on issues
  private calculatePerformanceScore(issues: CodeIssue[]): number {
    const performanceIssues = issues.filter(issue => issue.category === 'performance');
    const highSeverityCount = performanceIssues.filter(issue => issue.severity === 'high').length;
    const mediumSeverityCount = performanceIssues.filter(issue => issue.severity === 'medium').length;
    
    // Start with 100 and deduct points for issues
    let score = 100;
    score -= highSeverityCount * 20; // High severity: -20 points each
    score -= mediumSeverityCount * 10; // Medium severity: -10 points each
    
    return Math.max(0, score); // Ensure score doesn't go below 0
  }

  async analyzeCode(fileContent: string, fileName: string, language: string): Promise<AnalysisResult> {
    try {
      const fileHash = this.generateFileHash(fileContent);
      
      const conflictCheck = this.checkForConflicts(fileContent);
      
      if (this.issueCache.has(fileHash)) {
        const cachedIssues = this.issueCache.get(fileHash)!;
        // FIXED: Filter cached issues to show only critical and medium severity
        const filteredCached = cachedIssues.filter(issue => 
          issue.severity === 'high' || issue.severity === 'medium'
        );
        const performanceScore = this.calculatePerformanceScore(cachedIssues);
        return {
          issues: filteredCached,
          metrics: { complexity: 2, maintainability: 85, performanceScore },
          suggestions: ['Consider adding unit tests', 'Review code documentation'],
          fileHash,
          hasConflicts: conflictCheck.hasConflicts,
          conflictDetails: conflictCheck.conflictDetails
        };
      }

      const staticIssues = this.performStaticAnalysis(fileContent, fileName, language);
      const prettierIssues = this.checkPrettierFormatting(fileContent, fileName, language);
      const lintingIssues = this.performLinting(fileContent, fileName, language);
      const performanceIssues = this.analyzePerformance(fileContent, fileName, language);
      const securityIssues = this.analyzeSecurity(fileContent, fileName, language);
      
      const allIssues = [...staticIssues, ...prettierIssues, ...lintingIssues, ...performanceIssues, ...securityIssues];
      const uniqueIssues = this.deduplicateIssues(allIssues);
      
      // FIXED: Filter to show only critical and medium severity issues
      const filteredIssues = uniqueIssues.filter(issue => 
        issue.severity === 'high' || issue.severity === 'medium'
      );
      
      const finalIssues = filteredIssues.map(issue => ({
        ...issue,
        hash: this.generateIssueHash(issue),
        id: this.generateIssueId(issue)
      }));

      this.issueCache.set(fileHash, finalIssues);
      
      const performanceScore = this.calculatePerformanceScore(allIssues);
      
      return {
        issues: finalIssues,
        metrics: { complexity: 3, maintainability: 80, performanceScore },
        suggestions: ['Apply prettier formatting', 'Fix linting issues', 'Review code quality', 'Optimize performance'],
        fileHash,
        hasConflicts: conflictCheck.hasConflicts,
        conflictDetails: conflictCheck.conflictDetails
      };
    } catch (error) {
      console.error('Code analysis failed:', error);
      return {
        issues: [],
        metrics: { complexity: 0, maintainability: 0, performanceScore: 0 },
        suggestions: [],
        hasConflicts: false
      };
    }
  }

  // NEW: Full performance analysis
  private analyzePerformance(content: string, fileName: string, language: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();
      
      if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) {
        return;
      }
      
      if (language === 'javascript' || language === 'typescript') {
        // All the performance checks from analyzePerformanceOnLines
        if (/for\s*\(\s*let\s+\w+\s*=\s*0.*\.length/.test(line)) {
          const suggestedCode = line.replace(/for\s*\(\s*let\s+(\w+)\s*=\s*0;\s*\1\s*<\s*([^;]+)\.length;\s*\1\+\+\s*\)/, 
            'for (let $1 = 0, len = $2.length; $1 < len; $1++)');
          
          issues.push({
            type: 'warning',
            severity: 'medium',
            file: fileName,
            line: lineNumber,
            message: 'Inefficient loop: accessing .length property in each iteration',
            rule: 'performance/loop-optimization',
            category: 'performance',
            suggestion: 'Cache array length to avoid repeated property access',
            fixable: true,
            originalCode: line,
            suggestedCode,
          });
        }

        // Add more performance checks here...
      }
    });

    return issues;
  }

  // NEW: Full security analysis
  private analyzeSecurity(content: string, fileName: string, language: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();
      
      if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) {
        return;
      }
      
      if (language === 'javascript' || language === 'typescript') {
        // All the security checks from analyzeSecurityOnLines
        if (line.includes('innerHTML') && (line.includes('+') || line.includes('${') || line.includes('req.') || line.includes('input'))) {
          const suggestedCode = line.replace(/\.innerHTML\s*=/, '.textContent =');
          
          issues.push({
            type: 'error',
            severity: 'high',
            file: fileName,
            line: lineNumber,
            message: 'Potential XSS vulnerability - avoid setting innerHTML with user input',
            rule: 'security/no-xss',
            category: 'security',
            suggestion: 'Use textContent or sanitize HTML content with DOMPurify',
            fixable: true,
            originalCode: line,
            suggestedCode,
          });
        }

        // Add more security checks here...
      }
    });

    return issues;
  }

  private checkPrettierFormatting(content: string, fileName: string, language: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');

    if (language === 'javascript' || language === 'typescript') {
      lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const trimmedLine = line.trim();
        
        if (!trimmedLine) return;

        if (line.includes('"') && line.includes("'") && !line.includes('`')) {
          const suggestedCode = line.replace(/"/g, "'");
          issues.push({
            type: 'warning',
            severity: 'medium',
            file: fileName,
            line: lineNumber,
            message: 'Inconsistent quote style - prefer single quotes',
            rule: 'prettier/quotes',
            category: 'prettier',
            suggestion: 'Use consistent quote style (single quotes preferred)',
            fixable: true,
            originalCode: line,
            suggestedCode,
          });
        }

        if ((line.includes('{') || line.includes('[')) && 
            !line.includes(',') && 
            !line.includes('}') && 
            !line.includes(']') &&
            index < lines.length - 1) {
          const nextLine = lines[index + 1]?.trim();
          if (nextLine && (nextLine.startsWith('}') || nextLine.startsWith(']'))) {
            const suggestedCode = line + ',';
            issues.push({
              type: 'warning',
              severity: 'medium',
              file: fileName,
              line: lineNumber,
              message: 'Missing trailing comma',
              rule: 'prettier/trailing-comma',
              category: 'prettier',
              suggestion: 'Add trailing comma for better diffs',
              fixable: true,
              originalCode: line,
              suggestedCode,
            });
          }
        }

        if (/\w+[=+\-*/](?!\=)\w+/.test(line)) {
          const suggestedCode = line.replace(/(\w+)([=+\-*/])(?!\=)(\w+)/g, '$1 $2 $3');
          issues.push({
            type: 'warning',
            severity: 'medium',
            file: fileName,
            line: lineNumber,
            message: 'Missing spaces around operators',
            rule: 'prettier/operator-spacing',
            category: 'prettier',
            suggestion: 'Add spaces around operators for readability',
            fixable: true,
            originalCode: line,
            suggestedCode,
          });
        }

        if (line.length > 80) {
          issues.push({
            type: 'warning',
            severity: 'low',
            file: fileName,
            line: lineNumber,
            message: `Line too long (${line.length} characters, max 80)`,
            rule: 'prettier/printWidth',
            category: 'prettier',
            suggestion: 'Break long lines for better readability',
            fixable: false,
            originalCode: line,
          });
        }
      });
    }

    return issues;
  }

  private performLinting(content: string, fileName: string, language: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');

    if (language === 'javascript' || language === 'typescript') {
      lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const trimmedLine = line.trim();
        
        if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) {
          return;
        }

        if (/^let\s+\w+\s*=/.test(trimmedLine)) {
          const varName = trimmedLine.match(/^let\s+(\w+)/)?.[1];
          if (varName) {
            const restOfFile = lines.slice(index + 1, index + 20).join('\n');
            if (!restOfFile.includes(`${varName} =`) && !restOfFile.includes(`${varName}++`) && !restOfFile.includes(`${varName}--`)) {
              const suggestedCode = line.replace(/^(\s*)let\s+/, '$1const ');
              issues.push({
                type: 'warning',
                severity: 'medium',
                file: fileName,
                line: lineNumber,
                message: `'${varName}' is never reassigned. Use 'const' instead`,
                rule: 'prefer-const',
                category: 'eslint',
                suggestion: 'Use const for variables that are never reassigned',
                fixable: true,
                originalCode: line,
                suggestedCode,
              });
            }
          }
        }

        if (/function\s*\([^)]*\)\s*{/.test(line) && line.includes('.map(') || line.includes('.filter(') || line.includes('.forEach(')) {
          const suggestedCode = line.replace(/function\s*\(([^)]*)\)\s*{/, '($1) => {');
          issues.push({
            type: 'warning',
            severity: 'medium',
            file: fileName,
            line: lineNumber,
            message: 'Prefer arrow functions for callbacks',
            rule: 'prefer-arrow-callback',
            category: 'eslint',
            suggestion: 'Use arrow functions for better readability and lexical this',
            fixable: true,
            originalCode: line,
            suggestedCode,
          });
        }

        if (/^var\s+/.test(trimmedLine)) {
          const suggestedCode = line.replace(/^(\s*)var\s+/, '$1let ');
          issues.push({
            type: 'error',
            severity: 'high',
            file: fileName,
            line: lineNumber,
            message: 'Unexpected var, use let or const instead',
            rule: 'no-var',
            category: 'eslint',
            suggestion: 'Use let or const instead of var for block scoping',
            fixable: true,
            originalCode: line,
            suggestedCode,
          });
        }

        if (trimmedLine === '' && index > 0 && lines[index - 1]?.trim() === '') {
          issues.push({
            type: 'warning',
            severity: 'low',
            file: fileName,
            line: lineNumber,
            message: 'Multiple empty lines not allowed',
            rule: 'no-multiple-empty-lines',
            category: 'eslint',
            suggestion: 'Remove extra empty lines',
            fixable: true,
            originalCode: line,
            suggestedCode: '',
          });
        }

        if (line.includes('"') && line.includes('+') && /"\s*\+\s*\w+\s*\+\s*"/.test(line)) {
          const suggestedCode = line.replace(/"([^"]*?)"\s*\+\s*(\w+)\s*\+\s*"([^"]*?)"/g, '`$1${$2}$3`');
          issues.push({
            type: 'warning',
            severity: 'medium',
            file: fileName,
            line: lineNumber,
            message: 'Prefer template literals over string concatenation',
            rule: 'prefer-template',
            category: 'eslint',
            suggestion: 'Use template literals for string interpolation',
            fixable: true,
            originalCode: line,
            suggestedCode,
          });
        }
      });
    }

    return issues;
  }

  private performStaticAnalysisOnLines(content: string, fileName: string, language: string, targetLines: number[]): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');
    const targetLineSet = new Set(targetLines);

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      if (!targetLineSet.has(lineNumber)) {
        return;
      }
      
      const trimmedLine = line.trim();
      
      if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*')) {
        return;
      }
      
      if (language === 'javascript' || language === 'typescript') {
        if (line.includes('console.log') && !line.includes('//')) {
          const originalCode = line;
          const suggestedCode = line.replace(/console\.log\([^)]*\);?/, '// TODO: Remove console.log for production');
          
          issues.push({
            type: 'warning',
            severity: 'medium',
            file: fileName,
            line: lineNumber,
            message: 'Console.log statement should be removed for production',
            rule: 'no-console',
            category: 'best-practice',
            suggestion: 'Remove console.log statements or use proper logging library',
            fixable: true,
            originalCode,
            suggestedCode,
          });
        }

        if (this.shouldHaveSemicolon(trimmedLine) && !trimmedLine.endsWith(';')) {
          const suggestedCode = line + ';';
          
          issues.push({
            type: 'error',
            severity: 'high',
            file: fileName,
            line: lineNumber,
            message: 'Missing semicolon',
            rule: 'semi',
            category: 'eslint',
            suggestion: 'Add semicolon at end of statement',
            fixable: true,
            originalCode: line,
            suggestedCode,
          });
        }

        if (line.includes('==') && !line.includes('===') && !line.includes('!==')) {
          const suggestedCode = line.replace(/([^=!])={2}([^=])/g, '$1===$2').replace(/!={2}([^=])/g, '!==$1');
          
          issues.push({
            type: 'warning',
            severity: 'high',
            file: fileName,
            line: lineNumber,
            message: 'Use strict equality (===) instead of loose equality (==)',
            rule: 'eqeqeq',
            category: 'best-practice',
            suggestion: 'Use === and !== for strict equality checks',
            fixable: true,
            originalCode: line,
            suggestedCode,
          });
        }

        if (line.includes('await ') && !this.hasErrorHandling(lines, index)) {
          const indent = line.match(/^\s*/)?.[0] || '';
          const suggestedCode = `${indent}try {\n${line}\n${indent}} catch (error) {\n${indent}  console.error('Error:', error);\n${indent}}`;
          
          issues.push({
            type: 'warning',
            severity: 'high',
            file: fileName,
            line: lineNumber,
            message: 'Async operation without error handling',
            rule: 'require-await-error-handling',
            category: 'best-practice',
            suggestion: 'Wrap await calls in try-catch blocks',
            fixable: true,
            originalCode: line,
            suggestedCode,
          });
        }

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
              category: 'eslint',
              suggestion: `Prefix with underscore to indicate intentional non-use`,
              fixable: true,
              originalCode: line,
              suggestedCode,
            });
          }
        }
      }

      if (line.includes('eval(')) {
        issues.push({
          type: 'error',
          severity: 'high',
          file: fileName,
          line: lineNumber,
          message: 'Use of eval() is dangerous and should be avoided',
          rule: 'no-eval',
          category: 'security',
          suggestion: 'Replace eval() with safer alternatives like JSON.parse() or proper function calls',
          fixable: false,
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
          category: 'security',
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

  private performStaticAnalysis(content: string, fileName: string, language: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();
      
      if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*')) {
        return;
      }
      
      if (language === 'javascript' || language === 'typescript') {
        if (line.includes('console.log') && !line.includes('//')) {
          const originalCode = line;
          const suggestedCode = line.replace(/console\.log\([^)]*\);?/, '// TODO: Remove console.log for production');
          
          issues.push({
            type: 'warning',
            severity: 'medium',
            file: fileName,
            line: lineNumber,
            message: 'Console.log statement should be removed for production',
            rule: 'no-console',
            category: 'best-practice',
            suggestion: 'Remove console.log statements or use proper logging library',
            fixable: true,
            originalCode,
            suggestedCode,
          });
        }

        if (this.shouldHaveSemicolon(trimmedLine) && !trimmedLine.endsWith(';')) {
          const suggestedCode = line + ';';
          
          issues.push({
            type: 'error',
            severity: 'high',
            file: fileName,
            line: lineNumber,
            message: 'Missing semicolon',
            rule: 'semi',
            category: 'eslint',
            suggestion: 'Add semicolon at end of statement',
            fixable: true,
            originalCode: line,
            suggestedCode,
          });
        }

        if (line.includes('==') && !line.includes('===') && !line.includes('!==')) {
          const suggestedCode = line.replace(/([^=!])={2}([^=])/g, '$1===$2').replace(/!={2}([^=])/g, '!==$1');
          
          issues.push({
            type: 'warning',
            severity: 'high',
            file: fileName,
            line: lineNumber,
            message: 'Use strict equality (===) instead of loose equality (==)',
            rule: 'eqeqeq',
            category: 'best-practice',
            suggestion: 'Use === and !== for strict equality checks',
            fixable: true,
            originalCode: line,
            suggestedCode,
          });
        }

        if (line.includes('await ') && !this.hasErrorHandling(lines, index)) {
          const indent = line.match(/^\s*/)?.[0] || '';
          const suggestedCode = `${indent}try {\n${line}\n${indent}} catch (error) {\n${indent}  console.error('Error:', error);\n${indent}}`;
          
          issues.push({
            type: 'warning',
            severity: 'high',
            file: fileName,
            line: lineNumber,
            message: 'Async operation without error handling',
            rule: 'require-await-error-handling',
            category: 'best-practice',
            suggestion: 'Wrap await calls in try-catch blocks',
            fixable: true,
            originalCode: line,
            suggestedCode,
          });
        }
      }

      if (line.includes('eval(')) {
        issues.push({
          type: 'error',
          severity: 'high',
          file: fileName,
          line: lineNumber,
          message: 'Use of eval() is dangerous and should be avoided',
          rule: 'no-eval',
          category: 'security',
          suggestion: 'Replace eval() with safer alternatives like JSON.parse() or proper function calls',
          fixable: false,
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
          category: 'security',
          suggestion: 'Use textContent or sanitize HTML content before setting innerHTML',
          fixable: true,
          originalCode: line,
          suggestedCode,
        });
      }
    });

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

  private shouldHaveSemicolon(line: string): boolean {
    const needsSemicolonPatterns = [
      /^(let|const|var)\s+\w+.*[^{};]$/,
      /^return\s+.*[^{};]$/,
      /^throw\s+.*[^{};]$/,
      /^import\s+.*[^{};]$/,
      /^export\s+.*[^{};]$/,
      /\w+\([^)]*\)\s*$/,
      /^\w+\s*=\s*.*[^{};]$/,
    ];

    const noSemicolonPatterns = [
      /^(if|for|while|switch|try|catch|finally|function|class)\s*[\(\{]/,
      /^\s*[{}]\s*$/,
      /^\/\//,
      /^\/\*/,
      /^export\s+default\s+/,
    ];

    for (const pattern of noSemicolonPatterns) {
      if (pattern.test(line)) return false;
    }

    for (const pattern of needsSemicolonPatterns) {
      if (pattern.test(line)) return true;
    }

    return false;
  }

  private hasErrorHandling(lines: string[], currentIndex: number): boolean {
    const searchRange = 10;
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

  async fixIssues(content: string, issues: CodeIssue[]): Promise<string> {
    const fixableIssues = issues.filter(issue => issue.fixable && issue.suggestedCode);
    
    if (fixableIssues.length === 0) {
      console.log('No fixable issues found');
      return content;
    }

    console.log(`Fixing ${fixableIssues.length} issues`);
    
    let fixedContent = content;
    const lines = fixedContent.split('\n');

    fixableIssues.sort((a, b) => b.line - a.line);

    let appliedFixes = 0;
    
    fixableIssues.forEach(issue => {
      const lineIndex = issue.line - 1;
      if (lineIndex >= 0 && lineIndex < lines.length && issue.suggestedCode) {
        const originalLine = lines[lineIndex];
        
        if (issue.originalCode && originalLine.trim() === issue.originalCode.trim()) {
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

  clearCache(fileHash?: string) {
    if (fileHash) {
      this.issueCache.delete(fileHash);
    } else {
      this.issueCache.clear();
    }
  }

  async validateIssue(content: string, issue: CodeIssue): Promise<boolean> {
    const currentHash = this.generateFileHash(content);
    const issueHash = this.generateIssueHash(issue);
    
    if (this.issueCache.has(currentHash)) {
      const cachedIssues = this.issueCache.get(currentHash)!;
      return cachedIssues.some(i => i.hash === issueHash);
    }

    const analysis = await this.analyzeCode(content, issue.file, 'typescript');
    return analysis.issues.some(i => i.hash === issueHash);
  }
}