// Copyright 2021, Tomas Dabašinskas and the Ukko contributors
// SPDX-License-Identifier: MIT

import { expect } from 'chai'
import { runUkko, getLabels, assignLabels } from '../modules/ukko.js'
import { GmailMessage } from '../modules/google-apps-script.js'

describe('email filter tests', () => {
  describe('get labels tests', () => {
    it('should return list of labels for header named List-Id', () => {
      const headers = {
        'List-Id': 'Some List <somelist.example.com>'
      }
      const message = new GmailMessage(headers)
      const result = getLabels(message)
      const expectResult = ['lists/somelist']
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
  })
  describe('should return list of assigned labels', () => {
    it('output list of processed emails with labels applied', () => {
      const headers = {
        'List-Id': 'Some List <somelist.example.com>'
      }
      const message = new GmailMessage(headers)
      const result = assignLabels(message)
      const expectResult = ['lists/somelist']
      expect(result).to.eql(expectResult)
    })
  })
  describe('run filter tests', () => {
    it('output list of processed emails with labels applied', () => {
      const result = runUkko()
      const expectResult = { 'announce-list@example.com': ['lists/announce-list'], 'email@example.com': ['lists/planet-list'] }
      expect(result).to.eql(expectResult)
    })
  })
})
