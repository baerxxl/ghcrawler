// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const expect = require('chai').expect;
const extend = require('extend');
const finder = require('../lib/eventFinder.js');
const Q = require('q');

describe('Event Finder', () => {
  it('will find 1 document', () => {
    const events = [
      [{ url: 'http://test1' }, { url: 'http://test2' }]
    ];
    const eventDocuments = [{ 'http://test2': { etag: 34 } }];
    const instance = createFinder(events, eventDocuments);

    return instance.getNewEvents('http://test.com').then(found => {
      expect(found.length).to.be.equal(1);
      expect(found[0].url).to.be.equal('http://test1');
    });
  });

  it('will not find any documents', () => {
    const events = [
      [{ url: 'http://test1' }, { url: 'http://test2' }]
    ];
    const eventDocuments = [{ 'http://test1': { etag: 34 } }, { 'http://test2': { etag: 34 } }];
    const instance = createFinder(events, eventDocuments);

    return instance.getNewEvents('http://test.com').then(found => {
      expect(found.length).to.be.equal(0);
    });
  });

  it('will stop not finding at first found document', () => {
    const events = [
      [{ url: 'http://test1' }, { url: 'http://test2' }, { url: 'http://test3' }]
    ];
    const eventDocuments = [{ 'http://test2': { etag: 34 } }];
    const instance = createFinder(events, eventDocuments);

    return instance.getNewEvents('http://test.com').then(found => {
      expect(found.length).to.be.equal(2);
      expect(found[0].url).to.be.equal('http://test1');
      expect(found[1].url).to.be.equal('http://test3');
    });
  });
});

function createFinder(events, documents) {
  const eventStore = createStore(documents);
  const requestor = createRequestor(events);
  return new finder(requestor, eventStore);
}

function createRequestor(pages) {
  const result = {};
  result.getAll = () => {
    return Q(pages.shift());
  };
  return result;
}

function createStore(documents) {
  const result = {};
  const hash = documents.reduce((collection, document) => {
    extend(collection, document);
    return collection;
  }, {});
  result.etag = (type, url) => {
    let result = hash[url];
    return Q(result ? result.etag : null);
  };
  return result;
}