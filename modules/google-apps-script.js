// Copyright 2021, Tomas Dabašinskas and the Ukko contributors
// SPDX-License-Identifier: MIT

// https://developers.google.com/apps-script/reference/gmail/gmail-message
class GmailMessage {
  constructor (headers) {
    this.headers = headers
  }

  getFrom () {
    return this.getHeader('From')
  }

  getSubject () {
    return this.getHeader('Subject')
  }

  getThread () {
    return true
  }

  getHeader (headerName) {
    return this.headers[headerName]
  }
}

// https://developers.google.com/apps-script/reference/gmail/gmail-thread
class InboxThread {
  constructor (messages) {
    this.messages = messages
  }

  getMessages () {
    return this.messages
  }

  moveToArchive () {
    return true
  }
}

// https://developers.google.com/apps-script/reference/gmail/gmail-app
class GmailApp {
  constructor (inboxThreads) {
    this.inboxThreads = inboxThreads
  }

  getInboxThreads () {
    return this.inboxThreads
  }

  getUserLabelByName (labelName) {
    return false
  }

  createLabel (labelName) {
    return gmailLabel
  }
}

// https://developers.google.com/apps-script/reference/gmail/gmail-label
const gmailLabel = {}
gmailLabel.addToThread = (inboxThread) => {
  return inboxThread
}

// https://developers.google.com/apps-script/reference/base/logger
class Logger {
  log (text) {
    console.log(text)
  }
}

export { GmailApp, InboxThread, GmailMessage, Logger }
