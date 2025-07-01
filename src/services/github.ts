export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

export interface PullRequest {
  number: number;
  title: string;
  body: string;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
  };
  state: string;
  mergeable: boolean | null;
}

export interface FileChange {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

export class GitHubService {
  private token: string;
  private baseUrl = 'https://api.github.com';

  constructor(token: string) {
    this.token = token;
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'ReviewAI-Bot/1.0',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GitHub API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async getRepositories() {
    return this.request('/user/repos?sort=updated&per_page=100');
  }

  async getPullRequests(owner: string, repo: string, state = 'open') {
    return this.request(`/repos/${owner}/${repo}/pulls?state=${state}`);
  }

  async getPullRequestFiles(owner: string, repo: string, pullNumber: number): Promise<FileChange[]> {
    return this.request(`/repos/${owner}/${repo}/pulls/${pullNumber}/files`);
  }

  async getFileContent(owner: string, repo: string, path: string, ref?: string) {
    try {
      const endpoint = `/repos/${owner}/${repo}/contents/${path}${ref ? `?ref=${ref}` : ''}`;
      const response = await this.request(endpoint);
      
      if (response.content) {
        // Decode base64 content
        return atob(response.content.replace(/\s/g, ''));
      }
      return null;
    } catch (error) {
      console.error(`Failed to get content for ${path}:`, error);
      return null;
    }
  }

  async updateFileContent(
    owner: string, 
    repo: string, 
    path: string, 
    content: string, 
    message: string,
    sha?: string,
    branch?: string
  ) {
    try {
      const body: any = {
        message,
        content: btoa(unescape(encodeURIComponent(content))), // Proper UTF-8 encoding
      };

      if (sha) {
        body.sha = sha;
      }

      if (branch) {
        body.branch = branch;
      }

      console.log(`Updating file ${path} with message: ${message}`);
      
      const result = await this.request(`/repos/${owner}/${repo}/contents/${path}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });

      console.log(`Successfully updated ${path}`);
      return result;
    } catch (error) {
      console.error(`Failed to update file ${path}:`, error);
      throw error;
    }
  }

  async getFileSha(owner: string, repo: string, path: string, ref?: string) {
    try {
      const endpoint = `/repos/${owner}/${repo}/contents/${path}${ref ? `?ref=${ref}` : ''}`;
      const response = await this.request(endpoint);
      return response.sha;
    } catch (error) {
      console.error(`Failed to get SHA for ${path}:`, error);
      return null;
    }
  }

  async createPullRequestReview(
    owner: string, 
    repo: string, 
    pullNumber: number, 
    body: string, 
    event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT' = 'COMMENT'
  ) {
    return this.request(`/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`, {
      method: 'POST',
      body: JSON.stringify({
        body,
        event,
      }),
    });
  }

  async mergePullRequest(owner: string, repo: string, pullNumber: number, mergeMethod = 'merge') {
    return this.request(`/repos/${owner}/${repo}/pulls/${pullNumber}/merge`, {
      method: 'PUT',
      body: JSON.stringify({
        merge_method: mergeMethod,
      }),
    });
  }

  async createIssue(owner: string, repo: string, title: string, body: string) {
    return this.request(`/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      body: JSON.stringify({
        title,
        body,
      }),
    });
  }

  async updateIssue(owner: string, repo: string, issueNumber: number, updates: any) {
    return this.request(`/repos/${owner}/${repo}/issues/${issueNumber}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async closeIssue(owner: string, repo: string, issueNumber: number) {
    return this.updateIssue(owner, repo, issueNumber, { 
      state: 'closed',
      state_reason: 'completed'
    });
  }

  async getBranches(owner: string, repo: string) {
    return this.request(`/repos/${owner}/${repo}/branches`);
  }

  async getCommits(owner: string, repo: string, sha?: string) {
    const endpoint = `/repos/${owner}/${repo}/commits${sha ? `?sha=${sha}` : ''}`;
    return this.request(endpoint);
  }

  async createBranch(owner: string, repo: string, branchName: string, fromSha: string) {
    return this.request(`/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: fromSha,
      }),
    });
  }

  async createPullRequest(
    owner: string,
    repo: string,
    title: string,
    body: string,
    head: string,
    base: string = 'main'
  ) {
    return this.request(`/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      body: JSON.stringify({
        title,
        body,
        head,
        base,
      }),
    });
  }
}