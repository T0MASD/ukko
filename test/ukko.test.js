// Copyright 2021, Tomas Dabašinskas and the Ukko contributors
// SPDX-License-Identifier: MIT

import { expect } from 'chai'
import { runUkko, getLabels, getReMatch, assignLabels } from '../modules/ukko.js'
import { GmailMessage } from '../modules/google-apps-script.js'

describe('email filter tests', () => {
  describe('get regex tests', () => {
    it('should return email', () => {
      const from = 'Github <noreply@github.com>'
      const result = getReMatch('email', from)
      const expectResult = 'noreply@github.com'
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
    it('should return list of labels for emails from errata@security.com', () => {
      const headers = {
        From: 'Errata <errata@security.com>'
      }
      const message = new GmailMessage(headers)
      const result = getLabels(message)
      const expectResult = ['errata']
      expect(result).to.eql(expectResult)
    })
    it('should return list of labels for emails from team', () => {
      const headers = {
        From: 'First Last <flast@example.com>'
      }
      const message = new GmailMessage(headers)
      const result = getLabels(message)
      const expectResult = ['team/flast']
      expect(result).to.eql(expectResult)
    })
    it('should return list of labels for emails from some@subdomain.domain.com', () => {
      const headers = {
        From: 'some@subdomain.domain.com',
        'List-Id': '<some.subdomain.domain.com>'
      }
      const message = new GmailMessage(headers)
      const result = getLabels(message)
      const expectResult = ['lists/some/domain']
      expect(result).to.eql(expectResult)
    })
    it('should return list of labels for emails for jira', () => {
      const headers = {
        From: 'issues@example.come'
      }
      const message = new GmailMessage(headers)
      const result = getLabels(message)
      const expectResult = ['jira']
      expect(result).to.eql(expectResult)
    })
    it('should return list of labels for emails for jira project', () => {
      const headers = {
        From: 'issues@example.come',
        Subject: '[JIRA] (proj-123)'
      }
      const message = new GmailMessage(headers)
      const result = getLabels(message)
      const expectResult = ['jira/proj']
      expect(result).to.eql(expectResult)
    })
    it('should return list of labels for emails for bugzilla', () => {
      const headers = {
        From: 'bugzilla@example.come'
      }
      const message = new GmailMessage(headers)
      const result = getLabels(message)
      const expectResult = ['bz']
      expect(result).to.eql(expectResult)
    })
    it('should return list of labels for emails for bugzilla project', () => {
      const headers = {
        From: 'bugzilla@example.come',
        'X-Bugzilla-Product': 'scalable'
      }
      const message = new GmailMessage(headers)
      const result = getLabels(message)
      const expectResult = ['bz/scalable']
      expect(result).to.eql(expectResult)
    })
    it('should return list of labels for emails for bugzilla project acronym and component', () => {
      const headers = {
        From: 'bugzilla@example.come',
        'X-Bugzilla-Product': 'scalable enterprise platform',
        'X-Bugzilla-Component': 'component'
      }
      const message = new GmailMessage(headers)
      const result = getLabels(message)
      const expectResult = ['bz/sep/component']
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
        'Announce list <announce-list@example.com>': ['lists/announce-list/example'],
        'email@subdomain.example.com': ['lists/planet-list/example']
      }
      expect(result).to.eql(expectResult)
    })
  })
})
