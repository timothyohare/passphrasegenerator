import * as cdk from 'aws-cdk-lib';
import { PassphraseMcpStack } from '../lib/passphrase-mcp-stack';

const app = new cdk.App();

new PassphraseMcpStack(app, 'PassphraseMcpStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'ap-southeast-2',
  },
  description: 'Passphrase generator MCP server on Lambda',
});
