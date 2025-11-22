#!/usr/bin/env node

/**
 * Filter HubSpot MCP tools to keep core CRM operations only
 * Keeps: Companies, Contacts, Leads, Deals, Objects, Associations, Meetings, Notes, Tasks
 * Removes: Products, Emails, Communications, Calls, Engagement
 * This script modifies src/index.ts to comment out unwanted tools
 */

const fs = require('fs');
const path = require('path');

// Tools to keep: batch operations + search/get/list tools
const TOOLS_TO_KEEP = new Set([
  // Batch Operations - Associations
  'crm_batch_create_associations',

  // Batch Operations - Companies
  'crm_batch_create_companies',
  'crm_batch_update_companies',

  // Batch Operations - Contacts
  'crm_batch_create_contacts',
  'crm_batch_update_contacts',

  // Batch Operations - Deals
  'crm_batch_create_deals',
  'crm_batch_update_deals',

  // Batch Operations - Leads
  'crm_batch_create_leads',
  'crm_batch_update_leads',

  // Batch Operations - Objects
  'crm_batch_create_objects',
  'crm_batch_read_objects',
  'crm_batch_update_objects',

  // Batch Operations - Meetings
  'meetings_batch_archive',
  'meetings_batch_create',
  'meetings_batch_update',

  // Batch Operations - Notes
  'notes_batch_archive',
  'notes_batch_create',
  'notes_batch_read',
  'notes_batch_update',

  // Batch Operations - Tasks
  'tasks_batch_archive',
  'tasks_batch_create',
  'tasks_batch_read',
  'tasks_batch_update',

  // Search/Get/List - Companies
  'crm_get_company',
  'crm_search_companies',
  'crm_get_company_properties',

  // Search/Get/List - Objects
  'crm_list_objects',
  'crm_get_object',
  'crm_search_objects',

  // Search/Get/List - Associations
  'crm_list_association_types',
  'crm_get_associations',

  // Search/Get/List - Contacts
  'crm_get_contact',
  'crm_search_contacts',
  'crm_get_contact_properties',

  // Search/Get/List - Leads
  'crm_get_lead',
  'crm_search_leads',
  'crm_get_lead_properties',

  // Search/Get/List - Deals
  'crm_get_deal',
  'crm_search_deals',
  'crm_get_deal_properties',

  // Search/Get/List - Meetings
  'meetings_list',
  'meetings_get',
  'meetings_search',

  // Search/Get/List - Notes
  'notes_get',
  'notes_list',
  'notes_search',

  // Search/Get/List - Tasks
  'tasks_get',
  'tasks_list',
  'tasks_search'
]);

const sourcePath = path.join(__dirname, 'src', 'index.ts');
const backupPath = path.join(__dirname, 'src', 'index.ts.backup');

// Read the source file
console.log('Reading source file...');
const content = fs.readFileSync(sourcePath, 'utf8');

// Backup the original file
console.log('Creating backup...');
fs.copyFileSync(sourcePath, backupPath);

// Parse and filter tools
console.log('Filtering tools...');
const lines = content.split('\n');
const result = [];
let inToolBlock = false;
let currentToolName = null;
let toolBlockLines = [];
let commentedCount = 0;
let keptCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Check if this line starts a server.tool block
  const toolMatch = line.match(/server\.tool\(\s*["']([^"']+)["']/);

  if (toolMatch) {
    // Starting a new tool block
    inToolBlock = true;
    currentToolName = toolMatch[1];
    toolBlockLines = [line];
  } else if (inToolBlock) {
    toolBlockLines.push(line);

    // Check if this is the end of the tool block (closing parenthesis + closing brace)
    if (line.trim() === ')' && i + 1 < lines.length && lines[i + 1].trim() === '') {
      // End of tool block
      inToolBlock = false;

      // Decide whether to keep or comment this tool
      if (TOOLS_TO_KEEP.has(currentToolName)) {
        // Keep this tool
        result.push(...toolBlockLines);
        keptCount++;
        console.log(`✓ Keeping: ${currentToolName}`);
      } else {
        // Comment out this tool
        const commented = toolBlockLines.map(l => l.trim() === '' ? '' : `  // ${l}`);
        result.push(`  // [FILTERED] ${currentToolName}`);
        result.push(...commented);
        commentedCount++;
        console.log(`✗ Filtering: ${currentToolName}`);
      }

      toolBlockLines = [];
      currentToolName = null;
    }
  } else {
    // Not in a tool block, keep the line as-is
    result.push(line);
  }
}

// Write the filtered content
console.log('\nWriting filtered file...');
fs.writeFileSync(sourcePath, result.join('\n'), 'utf8');

console.log('\n=== SUMMARY ===');
console.log(`Tools kept: ${keptCount}`);
console.log(`Tools filtered: ${commentedCount}`);
console.log(`Total tools: ${keptCount + commentedCount}`);
console.log(`Backup saved to: ${backupPath}`);
console.log('Done!');
