// Copyright 2021, Tomas Dabašinskas and the Ukko contributors
// SPDX-License-Identifier: MIT

import { expect } from 'chai'
import { runUkko, getLabels, getReMatch, assignLabels } from '../modules/ukko.js'
import { GmailMessage } from '../modules/google-apps-script.js'

describe('email filter tests', () => {
  describe('get regex tests', () => {
    it('should return domain', () => {
      const from = 'Github <noreply@github.com>'
      const result = getReMatch('domain', from)
      const expectResult = 'github'
      expect(result).to.eql(expectResult)
    })
    it('should return username', () => {
      const from = 'Github <noreply@github.com>'
      const result = getReMatch('username', from)
      const expectResult = 'noreply'
      expect(result).to.eql(expectResult)
    })
    it('should return jira project', () => {
      const subject = '[JIRA] (proj-123)'
      const result = getReMatch('jiraproj', subject)
      const expectResult = 'proj'
      expect(result).to.eql(expectResult)
    })
    it('should return email', () => {
      const from = 'Github <noreply@github.com>'
      const result = getReMatch('email', from)
      const expectResult = 'noreply@github.com'
      expect(result).to.eql(expectResult)
    })
    it('should return list id', () => {
      const list = 'Some List <somelist.example.com>'
      const result = getReMatch('listid', list)
      const expectResult = 'somelist'
      expect(result).to.eql(expectResult)
    })
  })
  describe('get labels tests', () => {
    it('should return list of labels for header named List-Id', () => {
      const headers = {
        'List-Id': 'Some List <somelist.example.com>'
      }
      const message = new GmailMessage(headers)
      const result = getLabels(message)
      const expectResult = ['lists/somelist/example']
      expect(result).to.eql(expectResult)
    })
    it('should return list of labels for emails from @github.com', () => {
      const headers = {
        From: 'Github <noreply@github.com>'
      }
      const message = new GmailMessage(headers)
      const result = getLabels(message)
      const expectResult = ['github']
      expect(result).to.eql(expectResult)
    })
    it('should return list of labels for emails from errata@redhat.com', () => {
      const headers = {
        From: 'Red Hat Errata Notifications <errata@redhat.com>'
      }
      const message = new GmailMessage(headers)
      const result = getLabels(message)
      const expectResult = ['errata']
      expect(result).to.eql(expectResult)
    })
    it('should return list of labels for emails from team', () => {
      const headers = {
        From: 'First Last <flast@redhat.com>'
      }
      const message = new GmailMessage(headers)
      const result = getLabels(message)
      const expectResult = ['team/flast']
      expect(result).to.eql(expectResult)
    })
    it('should return list of labels for emails from some@434324325214.amazon.com', () => {
      const headers = {
        From: 'some@subdomain.domain.com',
        'List-Id': '<some.subdomain.amazon.com>'
      }
      const message = new GmailMessage(headers)
      const result = getLabels(message)
      const expectResult = ['lists/some/subdomain']
      expect(result).to.eql(expectResult)
    })
    it('should return list of labels for emails for jira', () => {
      const headers = {
        From: 'issues@jboss.org',
        Subject: '[Red Hat JIRA] Subscription: Filter for KC-STI'
      }
      const message = new GmailMessage(headers)
      const result = getLabels(message)
      const expectResult = ['jira']
      expect(result).to.eql(expectResult)
    })
    it('should return list of labels for emails for jira project', () => {
      const headers = {
        From: 'issues@jboss.org',
        Subject: '[Red Hat JIRA] (proj-123)'
      }
      const message = new GmailMessage(headers)
      const result = getLabels(message)
      const expectResult = ['jira/proj']
      expect(result).to.eql(expectResult)
    })
  })
  describe('should return list of assigned labels', () => {
    it('output list of processed emails with labels applied', () => {
      const headers = {
        'List-Id': 'Some List <somelist.example.com>'
      }
      const message = new GmailMessage(headers)
      const result = assignLabels(message)
      const expectResult = ['lists/somelist/example']
      expect(result).to.eql(expectResult)
    })
  })
  describe('run filter tests', () => {
    it('output list of processed emails with labels applied', () => {
      const result = runUkko()
      const expectResult = {
        'announce-list@example.com': ['lists/announce-list/example'],
        'email@example.com': ['lists/planet-list/example']
      }
      expect(result).to.eql(expectResult)
    })
  })
})
