// Copyright 2021, Tomas Dabašinskas and the Ukko contributors
// SPDX-License-Identifier: MIT

import { expect } from 'chai'
import { runUkko, getLabels, getReMatch, assignLabels, RULES, HANDLERS } from '../modules/ukko.js'
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
    it('should return to name', () => {
      const to = '"Some List" <somelist.example.com>'
      const result = getReMatch('to', to)
      const expectResult = 'Some List'
      expect(result).to.eql(expectResult)
    })
  })
  describe('get labels tests', () => {
    it('should return list of labels for header named List-Id', () => {
      const headers = {
        From: 'noreply@example.com',
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
    it('should sublabel @github.com when "To" header is set', () => {
      const headers = {
        From: 'Github <noreply@github.com>',
        To: '"My PROJ" <proj@gh.com>'
      }
      const message = new GmailMessage(headers)
      const result = getLabels(message)
      const expectResult = ['github/My PROJ']
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
    it('should not break with empty headers', () => {
      const headers = {}
      const message = new GmailMessage(headers)
      const result = getLabels(message)
      const expectResult = []
      expect(result).to.eql(expectResult)
    })
  })
  describe('should return list of assigned labels', () => {
    it('output list of processed emails with labels applied', () => {
      const headers = {
        From: 'bla@example.com',
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

  // ============================================================
  // CONFIG-DRIVEN ENGINE TESTS
  // ============================================================

  describe('config-driven rules engine', () => {
    describe('RULES and HANDLERS exports', () => {
      it('should export RULES as an array', () => {
        expect(RULES).to.be.an('array')
        expect(RULES.length).to.be.greaterThan(0)
      })
      it('should export HANDLERS as an object', () => {
        expect(HANDLERS).to.be.an('object')
      })
      it('each rule should have a header field', () => {
        for (const rule of RULES) {
          expect(rule).to.have.property('header')
        }
      })
      it('each rule should have a label field', () => {
        for (const rule of RULES) {
          expect(rule).to.have.property('label')
        }
      })
      it('handler rules should reference existing handlers', () => {
        for (const rule of RULES) {
          if (rule.handler) {
            expect(HANDLERS).to.have.property(rule.handler)
            expect(HANDLERS[rule.handler]).to.be.a('function')
          }
        }
      })
    })

    describe('contains matching', () => {
      it('should match when header contains substring', () => {
        const headers = { From: 'Github <noreply@github.com>' }
        const message = new GmailMessage(headers)
        const result = getLabels(message)
        expect(result).to.include('github')
      })
      it('should not match when header does not contain substring', () => {
        const headers = { From: 'Someone <user@unknown.com>' }
        const message = new GmailMessage(headers)
        const result = getLabels(message)
        expect(result).to.eql([])
      })
    })

    describe('endswith matching', () => {
      it('should match when header ends with suffix', () => {
        // Temporarily add an endswith rule to test the matching logic
        const testRule = { header: 'From', endswith: '@test-endswith.example.com', label: 'test-endswith' }
        RULES.push(testRule)
        try {
          const headers = { From: 'user@test-endswith.example.com' }
          const message = new GmailMessage(headers)
          const result = getLabels(message)
          expect(result).to.include('test-endswith')
        } finally {
          RULES.pop()
        }
      })
    })

    describe('fallback rules', () => {
      it('should apply fallback rule when no other rules matched', () => {
        // List-Id is a fallback rule — it should fire when no other rules matched
        const headers = {
          From: 'noreply@example.com',
          'List-Id': 'Some List <somelist.example.com>'
        }
        const message = new GmailMessage(headers)
        const result = getLabels(message)
        // should have the mailing list label
        expect(result.length).to.be.greaterThan(0)
        expect(result[0]).to.match(/^lists\//)
      })
      it('should NOT apply fallback rule when other rules already matched', () => {
        // GitHub From matches a non-fallback rule; List-Id is a fallback rule
        // When both headers are present, fallback should be skipped
        const headers = {
          From: 'Github <noreply@github.com>',
          'List-Id': 'Some List <somelist.example.com>'
        }
        const message = new GmailMessage(headers)
        const result = getLabels(message)
        // should have github label
        expect(result.join(',')).to.include('github')
        // should NOT have the fallback lists label
        const listsLabels = result.filter(l => l.startsWith('lists/'))
        expect(listsLabels).to.eql([])
      })
    })

    describe('handler with baseLabel', () => {
      it('github handler should use baseLabel from rule config', () => {
        const githubRule = RULES.find(r => r.handler === 'github')
        expect(githubRule).to.not.equal(undefined)
        const headers = {
          From: 'Github <noreply@github.com>',
          To: '"MyProject" <myproject@gh.com>'
        }
        const message = new GmailMessage(headers)
        const result = getLabels(message)
        expect(result).to.include(`${githubRule.label}/MyProject`)
      })
      it('jira handler should use baseLabel from rule config', () => {
        const jiraRule = RULES.find(r => r.handler === 'jira')
        expect(jiraRule).to.not.equal(undefined)
        const headers = {
          From: 'Jira <issues@example.com>',
          Subject: '[JIRA] (MYPROJ-456)'
        }
        const message = new GmailMessage(headers)
        const result = getLabels(message)
        expect(result).to.include(`${jiraRule.label}/MYPROJ`)
      })
      it('bugzilla handler should use baseLabel from rule config', () => {
        const bzRule = RULES.find(r => r.handler === 'bugzilla')
        expect(bzRule).to.not.equal(undefined)
        const headers = {
          From: 'Bugzilla <bugzilla@example.com>',
          'X-Bugzilla-Product': 'kernel',
          'X-Bugzilla-Component': 'networking'
        }
        const message = new GmailMessage(headers)
        const result = getLabels(message)
        expect(result).to.include(`${bzRule.label}/kernel/networking`)
      })
    })

    describe('multiple rules contributing labels', () => {
      it('should collect labels from multiple matching non-fallback rules', () => {
        // github (From) + calendar (Sender) — both are non-fallback rules
        const headers = {
          From: 'Github <noreply@github.com>',
          Sender: 'calendar-notification@google.com'
        }
        const message = new GmailMessage(headers)
        const result = getLabels(message)
        expect(result.length).to.be.greaterThan(1)
        expect(result).to.include('calendar')
      })
    })

    describe('no duplicate labels', () => {
      it('should not add the same label twice', () => {
        const headers = {
          From: 'Github <noreply@github.com>'
        }
        const message = new GmailMessage(headers)
        const result = getLabels(message)
        const unique = [...new Set(result)]
        expect(result).to.eql(unique)
      })
    })

    describe('gitlab project handler', () => {
      it('should label gitlab with project name from X-GitLab-Project header', () => {
        const gitlabRule = RULES.find(r => r.handler === 'gitlab_project')
        expect(gitlabRule).to.not.equal(undefined)
        const headers = {
          From: 'GitLab <gitlab@example.com>',
          'X-GitLab-Project': 'my-project'
        }
        const message = new GmailMessage(headers)
        const result = getLabels(message)
        expect(result).to.include(`${gitlabRule.label}/my-project`)
      })
    })

    describe('team handler', () => {
      it('should label team member by username', () => {
        const teamRule = RULES.find(r => r.handler === 'team')
        expect(teamRule).to.not.equal(undefined)
        const headers = {
          From: 'First Last <flast@example.com>'
        }
        const message = new GmailMessage(headers)
        const result = getLabels(message)
        expect(result).to.include(`${teamRule.label}/flast`)
      })
      it('should not label non-team members', () => {
        const teamRule = RULES.find(r => r.handler === 'team')
        expect(teamRule).to.not.equal(undefined)
        const headers = {
          From: 'Random Person <random@example.com>'
        }
        const message = new GmailMessage(headers)
        const result = getLabels(message)
        const teamLabels = result.filter(l => l.startsWith(teamRule.label))
        expect(teamLabels).to.eql([])
      })
    })

    describe('mailing list handler', () => {
      it('should label mailing list with list-id and sender domain', () => {
        const listRule = RULES.find(r => r.handler === 'mailing_list')
        expect(listRule).to.not.equal(undefined)
        const headers = {
          From: 'noreply@example.com',
          'List-Id': 'Some List <somelist.example.com>'
        }
        const message = new GmailMessage(headers)
        const result = getLabels(message)
        expect(result).to.include(`${listRule.label}/somelist/example`)
      })
    })
  })
})
