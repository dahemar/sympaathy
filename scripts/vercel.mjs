#!/usr/bin/env node

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
if (!VERCEL_TOKEN) {
  console.error('Missing env var VERCEL_TOKEN');
  process.exit(2);
}

const API_BASE = 'https://api.vercel.com';

async function api(path, { method = 'GET', body } = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { _raw: text };
  }
  if (!res.ok) {
    const message = typeof json === 'object' && json && (json.error?.message || json.message);
    throw new Error(`${method} ${path} -> ${res.status} ${res.statusText}${message ? `: ${message}` : ''}`);
  }
  return json;
}

function pick(obj, keys) {
  const out = {};
  for (const key of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key)) out[key] = obj[key];
  }
  return out;
}

async function getProjectByName(name) {
  return api(`/v1/projects/${encodeURIComponent(name)}`);
}

async function listDeploymentsByProjectId(projectId, limit = 10) {
  return api(`/v6/deployments?projectId=${encodeURIComponent(projectId)}&limit=${limit}`);
}

async function patchProject(projectId, patch) {
  return api(`/v9/projects/${encodeURIComponent(projectId)}`, { method: 'PATCH', body: patch });
}

async function redeploy(deploymentId) {
  // Vercel supports redeploy endpoint on deployments (versioned). If this endpoint changes,
  // we'll surface the exact error message to the user.
  return api(`/v13/deployments/${encodeURIComponent(deploymentId)}/redeploy`, { method: 'POST' });
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

async function cmdInspectProject(projectName) {
  const p = await getProjectByName(projectName);
  const summary = {
    project: pick(p, [
      'id',
      'name',
      'framework',
      'rootDirectory',
      'installCommand',
      'buildCommand',
      'outputDirectory',
      'devCommand',
      'aliases',
    ]),
    gitRepository: p.gitRepository ? pick(p.gitRepository, ['type', 'repo', 'org', 'productionBranch', 'branch', 'ref']) : null,
    link: p.link ? pick(p.link, ['type', 'repo', 'org', 'productionBranch', 'sourceless', 'createdAt', 'updatedAt']) : null,
  };

  const dep = await listDeploymentsByProjectId(p.id, 10);
  const deployments = (dep.deployments || []).map((d) => {
    const meta = d.meta || {};
    return {
      id: d.uid || d.id,
      target: d.target,
      state: d.state || d.readyState,
      createdAt: d.createdAt || d.created,
      commit: meta.githubCommitSha || meta.commitSha || meta.commit || null,
      branch: meta.githubCommitRef || meta.branch || null,
    };
  });

  summary.deployments = deployments;
  printJson(summary);
}

async function cmdFixRoot(projectName, rootDirectory) {
  const p = await getProjectByName(projectName);
  const patch = {
    rootDirectory,
    framework: 'vite',
    installCommand: 'npm install',
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
    devCommand: 'npm run dev',
  };

  const updated = await patchProject(p.id, patch);
  printJson({ updated: pick(updated, ['id', 'name', 'framework', 'rootDirectory', 'installCommand', 'buildCommand', 'outputDirectory', 'devCommand']) });
}

async function cmdRedeployLatestProduction(projectName) {
  const p = await getProjectByName(projectName);
  const dep = await listDeploymentsByProjectId(p.id, 20);
  const deployments = dep.deployments || [];
  const production = deployments.find((d) => d.target === 'production') || deployments[0];
  if (!production) {
    throw new Error(`No deployments found for project ${projectName}`);
  }
  const deploymentId = production.uid || production.id;
  if (!deploymentId) {
    throw new Error(`Could not determine deployment id (uid/id missing) for project ${projectName}`);
  }
  const result = await redeploy(deploymentId);
  printJson({ redeployedFrom: deploymentId, result });
}

async function cmdDeleteProject(projectName) {
  const p = await getProjectByName(projectName);
  const result = await api(`/v1/projects/${encodeURIComponent(p.id)}`, { method: 'DELETE' });
  printJson({ deleted: projectName, id: p.id, result });
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);

  try {
    if (cmd === 'inspect-project') return await cmdInspectProject(args[0]);
    if (cmd === 'fix-root') return await cmdFixRoot(args[0], args[1] || 'frontend');
    if (cmd === 'redeploy-latest-production') return await cmdRedeployLatestProduction(args[0]);
    if (cmd === 'delete-project') return await cmdDeleteProject(args[0]);

    console.error('Usage:');
    console.error('  VERCEL_TOKEN=... node scripts/vercel.mjs inspect-project <projectName>');
    console.error('  VERCEL_TOKEN=... node scripts/vercel.mjs fix-root <projectName> [rootDirectory]');
    console.error('  VERCEL_TOKEN=... node scripts/vercel.mjs redeploy-latest-production <projectName>');
    console.error('  VERCEL_TOKEN=... node scripts/vercel.mjs delete-project <projectName>');
    process.exit(2);
  } catch (err) {
    console.error(String(err?.stack || err?.message || err));
    process.exit(1);
  }
}

await main();
