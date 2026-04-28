import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import dagre from 'dagre';

/**
 * CLI-based layout engine for Modscape.
 * Replicates the logic from the visualizer to ensure consistency.
 */
export function applyLayout(inputPath, options = {}) {
  const absolutePath = path.resolve(process.cwd(), inputPath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`  ❌ File not found: ${inputPath}`);
    return;
  }

  const raw = fs.readFileSync(absolutePath, 'utf8');
  let schema;
  try {
    schema = yaml.load(raw);
  } catch (e) {
    console.error(`  ❌ Failed to parse YAML: ${e.message}`);
    return;
  }

  if (!schema || !schema.tables) {
    console.error('  ❌ Invalid schema: No tables found.');
    return;
  }

  const consumers = Array.isArray(schema.consumers) ? schema.consumers : [];
  const totalNodes = schema.tables.length + consumers.length;
  console.log(`  🏗️  Calculating layout for ${schema.tables.length} tables and ${consumers.length} consumers...`);

  // Normalize domain members: support both `members` (new) and `tables` (legacy)
  const domains = (schema.domains || []).map(d => ({
    ...d,
    members: Array.isArray(d.members) ? d.members : (Array.isArray(d.tables) ? d.tables : []),
  }));

  // Initialize Dagre Graph
  const g = new dagre.graphlib.Graph({ compound: true });
  g.setGraph({
    rankdir: 'LR',
    nodesep: 80,
    ranksep: 200,
    marginx: 80,
    marginy: 80,
  });
  g.setDefaultEdgeLabel(() => ({}));

  // 1. Add Tables
  schema.tables.forEach((table) => {
    g.setNode(table.id, { width: 280, height: 160 });
  });

  // 2. Add Consumer nodes
  consumers.forEach((uc) => {
    g.setNode(uc.id, { width: 160, height: 60 });
  });

  // 3. Add Lineage Edges (tables and consumers)
  if (schema.lineage) {
    schema.lineage.forEach((edge) => {
      if (g.hasNode(edge.from) && g.hasNode(edge.to)) {
        g.setEdge(edge.from, edge.to);
      }
    });
  }

  // 4. Add ER Relationships
  if (schema.relationships) {
    schema.relationships.forEach((rel) => {
      if (g.hasNode(rel.from.table) && g.hasNode(rel.to.table)) {
        g.setEdge(rel.from.table, rel.to.table);
      }
    });
  }

  // 5. Setup Domains (members can be tables or consumers)
  if (domains.length > 0) {
    domains.forEach((domain) => {
      g.setNode(domain.id, { label: domain.name, cluster: true });
      domain.members.forEach((memberId) => {
        if (g.hasNode(memberId)) {
          g.setParent(memberId, domain.id);
        }
      });
    });
  }

  // Execute Layout Calculation
  dagre.layout(g);

  // 6. Post-process: Convert Dagre results to Modscape Layout format
  const newLayout = {};
  const PAD = 48;
  const TABLE_W = 280;
  const GAP = 40;

  const estimateTableHeight = (tableId) => {
    const table = schema.tables.find(t => t.id === tableId);
    const colCount = table?.columns?.length ?? 0;
    return 44 + colCount * 36;
  };

  // Process Domains (Grid packing)
  if (domains.length > 0) {
    domains.forEach(domain => {
      const members = domain.members.filter(mid => g.hasNode(mid));
      if (members.length === 0) return;

      // Sort by dagre rank (left -> right)
      members.sort((a, b) => g.node(a).x - g.node(b).x);

      const cols = Math.min(3, Math.ceil(Math.sqrt(members.length)));
      const rowCount = Math.ceil(members.length / cols);

      const rowH = Array.from({ length: rowCount }, (_, row) => {
        let max = 0;
        for (let c = 0; c < cols; c++) {
          const m = members[row * cols + c];
          if (m) max = Math.max(max, estimateTableHeight(m));
        }
        return max;
      });

      const gridW = cols * (TABLE_W + GAP) - GAP;
      const gridH = rowH.reduce((s, h) => s + h + GAP, 0) - GAP;

      const cx = members.reduce((s, mid) => s + g.node(mid).x, 0) / members.length;
      const cy = members.reduce((s, mid) => s + g.node(mid).y, 0) / members.length;
      const originX = cx - gridW / 2;
      const originY = cy - gridH / 2;

      let rowStartY = 0;
      members.forEach((mid, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        if (col === 0 && row > 0) {
          rowStartY += rowH[row - 1] + GAP;
        }
        const xOff = col * (TABLE_W + GAP) + TABLE_W / 2;
        const yOff = rowStartY + rowH[row] / 2;
        newLayout[mid] = {
          x: Math.round(originX + xOff),
          y: Math.round(originY + yOff),
          parentId: domain.id
        };
      });

      // Domain bounding box
      const HEADER = 28;
      newLayout[domain.id] = {
        x: Math.round(originX - PAD),
        y: Math.round(originY - PAD - HEADER),
        width: Math.round(gridW + PAD * 2),
        height: Math.round(gridH + PAD * 2 + HEADER)
      };
    });
  }

  // Standalone Tables
  const domainMemberIds = new Set(domains.flatMap(d => d.members));

  // Identify nodes that have at least one edge (connected) vs isolated
  const connectedIds = new Set();
  (schema.lineage || []).forEach(e => { connectedIds.add(e.from); connectedIds.add(e.to); });
  (schema.relationships || []).forEach(r => { connectedIds.add(r.from.table); connectedIds.add(r.to.table); });

  const standaloneConnected = [];
  const standaloneIsolated = [];
  schema.tables.forEach(t => {
    if (!domainMemberIds.has(t.id)) {
      if (connectedIds.has(t.id)) standaloneConnected.push(t);
      else standaloneIsolated.push(t);
    }
  });

  // Place connected standalone tables at dagre positions
  standaloneConnected.forEach(t => {
    const pos = g.node(t.id);
    newLayout[t.id] = { x: Math.round(pos.x), y: Math.round(pos.y) };
  });

  // Compute bounding box of all already-placed nodes to anchor isolated grid below
  const allPlaced = Object.values(newLayout);
  let maxY = 0;
  let minX = Infinity;
  let maxX = -Infinity;
  if (allPlaced.length > 0) {
    allPlaced.forEach(pos => {
      if (pos.y > maxY) maxY = pos.y;
      if (pos.x < minX) minX = pos.x;
      if (pos.x > maxX) maxX = pos.x;
    });
  }

  // Place isolated standalone tables in a grid below connected nodes
  if (standaloneIsolated.length > 0) {
    const ISOLATED_COLS = Math.min(4, Math.ceil(Math.sqrt(standaloneIsolated.length)));
    const gridStartX = allPlaced.length > 0 ? Math.round(minX) : 0;
    const maxH = standaloneIsolated.reduce((m, t) => Math.max(m, estimateTableHeight(t.id)), 0);
    const gridStartY = allPlaced.length > 0 ? Math.round(maxY + maxH + GAP * 3) : 0;
    standaloneIsolated.forEach((t, idx) => {
      const col = idx % ISOLATED_COLS;
      const row = Math.floor(idx / ISOLATED_COLS);
      const h = estimateTableHeight(t.id);
      newLayout[t.id] = {
        x: Math.round(gridStartX + col * (TABLE_W + GAP) + TABLE_W / 2),
        y: Math.round(gridStartY + row * (maxH + GAP) + h / 2),
      };
    });
  }

  // Standalone Usecases
  consumers.forEach(uc => {
    if (!domainMemberIds.has(uc.id)) {
      const pos = g.node(uc.id);
      if (pos) newLayout[uc.id] = { x: Math.round(pos.x), y: Math.round(pos.y) };
    }
  });

  // 7. Save back to YAML (write members, not tables, for domains)
  schema.domains = domains.map(d => {
    const { members, ...rest } = d;
    return { ...rest, members };
  });
  schema.layout = newLayout;
  const outputPath = options.output ? path.resolve(process.cwd(), options.output) : absolutePath;

  fs.writeFileSync(outputPath, yaml.dump(schema, { indent: 2, lineWidth: -1, noRefs: true }), 'utf8');
  console.log(`  ✅ Layout complete! Saved to: ${path.relative(process.cwd(), outputPath)}`);
}
