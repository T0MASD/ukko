// Copyright 2021, Tomas Dabašinskas and the Ukko contributors
// SPDX-License-Identifier: MIT

import { GmailApp, InboxThread, GmailMessage, Logger } from './modules/google-apps-script.js'
import { runUkko } from './modules/ukko.js'

// Setup data
const headers1 = {
  From: 'Announce list <announce-list@example.com>',
  'List-Id': 'Announce List <announce-list.example.com>'
}
const headers2 = {
  From: 'email@subdomain.example.com',
  'List-Id': 'Planet List <planet-list.example.com>'
}

const message1 = new GmailMessage(headers1)
const message2 = new GmailMessage(headers2)

const inboxThread1 = new InboxThread([message1])
const inboxThread2 = new InboxThread([message1, message2])

const gmailApp = new GmailApp([inboxThread1, inboxThread2])
const logger = new Logger()

export { gmailApp as GmailApp, logger as Logger }

runUkko()
