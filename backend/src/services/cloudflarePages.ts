import axios from 'axios';
import FormData from 'form-data';

export class CloudflarePagesService {
  private apiToken: string;
  private accountId: string;
  private projectName: string;

  constructor() {
    this.apiToken = process.env.CF_API_TOKEN || '';
    this.accountId = process.env.CF_ACCOUNT_ID || '';
    this.projectName = process.env.CF_PROJECT_NAME || 'paver';

    if (!this.apiToken || !this.accountId) {
      throw new Error('CF_API_TOKEN and CF_ACCOUNT_ID environment variables are required');
    }
  }

  async createProject(): Promise<{ name: string; subdomain: string }> {
    try {
      const response = await axios.post(
        `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/pages/projects`,
        {
          name: this.projectName,
          production_branch: 'main'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.success) {
        throw new Error(`CF project creation failed: ${JSON.stringify(response.data.errors)}`);
      }

      return {
        name: response.data.result.name,
        subdomain: response.data.result.subdomain
      };
    } catch (error: any) {
      // Project may already exist (8000007 = project already exists)
      if (error.response?.data?.errors?.[0]?.code === 8000007) {
        console.log(`CF Pages project "${this.projectName}" already exists`);
        return { name: this.projectName, subdomain: `${this.projectName}.pages.dev` };
      }
      throw error;
    }
  }

  async deploy(files: Map<string, string>): Promise<string> {
    // Ensure project exists
    await this.createProject();

    const form = new FormData();

    for (const [filePath, content] of files.entries()) {
      form.append(filePath, Buffer.from(content, 'utf-8'), {
        filename: filePath,
        contentType: 'text/html'
      });
    }

    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/pages/projects/${this.projectName}/deployments`,
      form,
      {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          ...form.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 120000
      }
    );

    if (!response.data.success) {
      throw new Error(`CF deployment failed: ${JSON.stringify(response.data.errors)}`);
    }

    const deployUrl = response.data.result.url;
    console.log(`Deployed to CF Pages: ${deployUrl}`);
    return deployUrl;
  }

  getProjectUrl(): string {
    return `https://${this.projectName}.pages.dev`;
  }
}
