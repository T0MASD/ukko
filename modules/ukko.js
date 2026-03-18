// Copyright 2021, Tomas Dabašinskas and the Ukko contributors
// SPDX-License-Identifier: MIT

import { GmailApp, Logger } from '../app.js'
// import line used used for testing ukko locally
// when running on google script engine paste
// LINES BELOW

// gmail filter for google script!
// Ukko is a code name for a google script tool accessing gmail
// inbox threads, looping over them and assigning labels based on
// the email metadata. It's intended be setup via google drive
// and have time driven trigger.
//
// https://github.com/T0MASD/ukko#readme

// ============================================================
// RULES CONFIG
// ============================================================
// Each rule checks a message header against a pattern.
//
// Fields:
//   header   - email header name (From, Sender, To, List-Id, X-GitLab-Project, etc.)
//   contains - substring match against header value
//   endswith - suffix match against header value
//   label    - static label to assign (or base label for handlers)
//   handler  - name of handler function for dynamic sublabeling
//   fallback - only apply if no labels matched yet (default: false)
//
// Rules are evaluated in order. Multiple rules can contribute labels.
// Fallback rules only fire when no labels have been assigned yet.
// ============================================================

const RULES = [
  // --- dev: development tools and notifications ---
  { header: 'From', contains: '@github.com', label: 'github', handler: 'github' },
  { header: 'From', contains: '@docs.google.com', label: 'gdrive' },
  { header: 'Sender', contains: 'calendar-notification@google.com', label: 'calendar' },
  { header: 'From', contains: 'errata@', label: 'errata' },
  { header: 'From', contains: 'issues@', label: 'jira', handler: 'jira' },
  { header: 'From', contains: 'bugzilla@', label: 'bz', handler: 'bugzilla' },

  // --- username match (team members) ---
  { header: 'From', label: 'team', handler: 'team' },

  // --- header-exists rules ---
  { header: 'X-GitLab-Project', label: 'gitlab', handler: 'gitlab_project' },

  // --- List-Id rules (fallback — only if nothing else matched) ---
  { header: 'List-Id', label: 'lists', handler: 'mailing_list', fallback: true }
]

// team members for username matching
const TEAM = ['flast']

// ============================================================
// HANDLERS append dynamic sublabels to the base label from config
// Each handler receives (message, baseLabel) and returns [label] or []
// ============================================================

const HANDLERS = {
  // appends github project from To header: github/{project}
  github: function (message, baseLabel) {
    let label = baseLabel
    const toValue = message.getHeader('To')
    if (toValue) {
      const ghProj = getReMatch('to', toValue)
      if (ghProj) { label += `/${ghProj}` }
    }
    return [label]
  },

  // appends jira project from subject: jira/{PROJECT}
  jira: function (message, baseLabel) {
    let label = baseLabel
    const subject = message.getHeader('Subject') || ''
    const jiraProj = getReMatch('jiraproj', subject)
    if (jiraProj) { label += `/${jiraProj}` }
    return [label]
  },

  // appends bugzilla product/component: bz/{product}/{component}
  bugzilla: function (message, baseLabel) {
    let label = baseLabel
    const bzProdHeader = message.getHeader('X-Bugzilla-Product')
    if (bzProdHeader) {
      let bzProd
      if (bzProdHeader.split(' ').length > 1) {
        bzProd = getReMatch('acronym', bzProdHeader)
      } else {
        bzProd = bzProdHeader
      }
      label += `/${bzProd}`
      const bzComponent = message.getHeader('X-Bugzilla-Component')
      if (bzComponent) { label += `/${bzComponent}` }
    }
    return [label]
  },

  // appends team member username: team/{username}
  team: function (message, baseLabel) {
    const from = message.getHeader('From') || ''
    const email = getReMatch('email', from.trim())
    if (email && email.includes('@')) {
      const username = email.split('@')[0]
      if (TEAM.includes(username)) {
        return [`${baseLabel}/${username}`]
      }
    }
    return []
  },

  // appends gitlab project name: gitlab/{project}
  gitlab_project: function (message, baseLabel) {
    return [`${baseLabel}/${message.getHeader('X-GitLab-Project')}`]
  },

  // appends list-id and sender domain: lists/{list-id}/{domain}
  mailing_list: function (message, baseLabel) {
    const from = message.getHeader('From') || ''
    const email = getReMatch('email', from.trim())
    let messageFromDomain = ''
    if (email && email.includes('@') && email.includes('.')) {
      const fqdn = email.split('@')[1]
      messageFromDomain = fqdn.split('.').reverse()[1]
    }
    const listIDshort = getReMatch('listid', message.getHeader('List-Id'))
    let label = baseLabel + '/' + listIDshort
    if (messageFromDomain !== 'mydomain') {
      label += `/${messageFromDomain}`
    }
    return [label]
  }
}

// ============================================================
// CORE ENGINE
// ============================================================

// loop over inboxThreads and process
function runUkko () {
  const result = {}
  const inboxThreads = GmailApp.getInboxThreads()
  for (const inboxThread of inboxThreads) {
    const lastMessage = getLastMessage(inboxThread)
    const labels = assignLabels(lastMessage)

    // uncomment below if you want threads with assigned labels to be archived automatically
    // if (labels.length) { inboxThread.moveToArchive() }

    // prep result
    const from = lastMessage.getFrom()
    result[from] = labels
    Logger.log(`from:${lastMessage.getFrom()} labels:${labels}`)
  }
  return result
}

// process inboxThread
function getLastMessage (inboxThread) {
  // load inboxThread messages
  const messages = inboxThread.getMessages()
  // get last message from the thread
  return messages[messages.length - 1]
}

// assign labels to message thread
function assignLabels (message) {
  // load labels for message
  const labels = getLabels(message)
  // load message inboxThread to add labels to
  const inboxThread = message.getThread()
  // loop over ["list/list-id","jira/proj/123"]
  for (const label of labels) {
    let labelName = ''
    // loop over ["jira", "proj", "123"]
    for (const subLabel of label.split('/')) {
      // make labels jira jira/proj jira/proj/123
      labelName = labelName + (labelName === '' ? '' : '/') + subLabel
      // create label
      const gmailLabel = GmailApp.getUserLabelByName(labelName)
        ? GmailApp.getUserLabelByName(labelName)
        : GmailApp.createLabel(labelName)
      gmailLabel.addToThread(inboxThread)
    }
  }
  return labels
}

// evaluate rules config against message headers
function getLabels (message) {
  const labels = []

  for (const rule of RULES) {
    // skip fallback rules if we already have labels
    if (rule.fallback && labels.length) { continue }

    // get header value
    const headerValue = message.getHeader(rule.header)
    if (!headerValue) { continue }

    // check match
    let matched = false
    if (rule.contains) {
      matched = headerValue.includes(rule.contains)
    } else if (rule.endswith) {
      matched = headerValue.endsWith(rule.endswith)
    } else if (rule.handler) {
      // handler-only rule (no pattern, e.g. team) — always runs if header exists
      matched = true
    }

    if (matched) {
      if (rule.handler && HANDLERS[rule.handler]) {
        const handlerLabels = HANDLERS[rule.handler](message, rule.label)
        for (const l of handlerLabels) {
          if (!labels.includes(l)) { labels.push(l) }
        }
      } else if (rule.label) {
        if (!labels.includes(rule.label)) { labels.push(rule.label) }
      }
    }
  }

  return labels
}

// regex helper
function getReMatch (kind, myStr) {
  let re
  switch (kind) {
    case 'jiraproj':
      re = /\((\w+[^-])-\d+\)/i
      break
    case 'email':
      re = /[^@<\s]+@[^@\s>]+/gi
      break
    case 'listid':
      re = /<([^.]+).+>/i
      break
    case 'to':
      re = /"(.*?)"/i
      break
    case 'acronym':
      re = /\b(\w)/g
      return myStr.match(re).join('')
  }
  if (myStr.match(re)) {
    return myStr.match(re).pop()
  }
}

// END

// line below used for testing ukko locally
// when running on google script engine
// EXCLUDE LINE BELOW
export { runUkko, getLabels, getReMatch, assignLabels, RULES, HANDLERS }
