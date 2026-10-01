import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { execSync } from 'node:child_process';
import * as path from 'path';
import { Construct } from 'constructs';

// Project root is two levels above this file (infra/lib/ → project root).
const PROJECT_ROOT = path.join(__dirname, '..', '..');

export class PassphraseMcpStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    if (!/^[a-f0-9]{64}$/i.test(process.env.MCP_API_KEY_HASH ?? '')) {
      throw new Error('MCP_API_KEY_HASH must be a 64-character SHA-256 hex digest');
    }

    const logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: '/aws/lambda/passphrase-mcp-server',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const mcpFunction = new lambda.Function(this, 'McpFunction', {
      functionName: 'passphrase-mcp-server',
      description: 'Passphrase generator exposed as an MCP tool server',
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      // Handler path preserves the original directory structure inside the zip,
      // so relative imports (../../passphrase.js, ../google-10000-*.txt) resolve correctly.
      handler: 'mcp-server/handler.handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      logGroup,
      environment: {
        NODE_ENV: 'production',
        // SHA-256 hex of the API key. Set via the MCP_API_KEY_HASH environment
        // variable when running `cdk deploy` (see deploy-mcp.yml).
        API_KEY_HASH: process.env.MCP_API_KEY_HASH!,
      },
      code: lambda.Code.fromAsset(PROJECT_ROOT, {
        // Exclude large/unnecessary files from the asset hash calculation.
        exclude: [
          'words_alpha.txt',
          'node_modules',
          '.git',
          'infra/node_modules',
          'infra/dist',
          'infra/cdk.out',
          'mcp-server/node_modules',
        ],
        bundling: {
          // Try local bundling first (no Docker required).
          local: {
            tryBundle(outputDir: string): boolean {
              try {
                execSync(
                  [
                    `mkdir -p "${outputDir}/mcp-server"`,
                    `cp -r "${PROJECT_ROOT}/mcp-server/." "${outputDir}/mcp-server/"`,
                    `cp "${PROJECT_ROOT}"/google-10000-english-usa-no-swears-*.txt "${outputDir}/"`,
                    `cp "${PROJECT_ROOT}/passphrase.js" "${outputDir}/"`,
                    // Root package.json marks the bundle as ESM so Node treats passphrase.js correctly.
                    `echo '{"type":"module"}' > "${outputDir}/package.json"`,
                    `cd "${outputDir}/mcp-server" && npm ci --omit=dev`,
                  ].join(' && '),
                  { stdio: 'inherit', shell: '/bin/bash' }
                );
                return true;
              } catch {
                return false; // fall through to Docker bundling
              }
            },
          },
          // Docker fallback (used in CI if local bundling is unavailable).
          image: lambda.Runtime.NODEJS_22_X.bundlingImage,
          command: [
            'bash', '-c',
            [
              'mkdir -p /asset-output/mcp-server',
              'cp -r /asset-input/mcp-server/. /asset-output/mcp-server/',
              'cp /asset-input/google-10000-english-usa-no-swears-*.txt /asset-output/',
              'cp /asset-input/passphrase.js /asset-output/',
              // Root package.json marks the bundle as ESM so Node treats passphrase.js correctly.
              "echo '{\"type\":\"module\"}' > /asset-output/package.json",
              'cd /asset-output/mcp-server && npm ci --omit=dev',
            ].join(' && '),
          ],
          user: 'root',
        },
      }),
    });

    const functionUrl = mcpFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [lambda.HttpMethod.POST],
        allowedHeaders: ['Content-Type', 'x-api-key'],
        maxAge: cdk.Duration.hours(1),
      },
    });

    new cdk.CfnOutput(this, 'McpEndpoint', {
      value: `${functionUrl.url}mcp`,
      description: 'MCP server endpoint — use this URL in Claude Desktop config',
    });

    new cdk.CfnOutput(this, 'HealthEndpoint', {
      value: `${functionUrl.url}health`,
      description: 'Health check endpoint',
    });
  }
}
