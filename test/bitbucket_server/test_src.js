$(function(){
    sinon.stub($, 'ajax').yieldsTo('success', report);
    sinon.stub(BitbucketServer.prototype, '_validate_codecov_yml').returns(true)
    window.cc = new BitbucketServer({
      'urlid': 'https://codecov.io',
      'debug': true,
      'callback': mocha.run,
      'overlay': true,
      'enterprise': '',
      'debug_url': 'http://localhost:7990/projects/TES/repos/gulp_starter/browse/src/js/modules/test.js?at=7dec885055d274944da5501e7985a2d91a6dbb9e'
    });
});

describe('Bitbucket server src', function() {
    
    it('Should start with no errors', function() {
	  expect(window.cc).to.have.property('slug').and.to.equal('TES/gulp_starter');
      expect(window.cc).to.have.property('ref').and.to.equal('7dec885055d274944da5501e7985a2d91a6dbb9e');
      expect(window.cc).to.have.property('page').and.to.equal('browse');
      expect(window.cc).to.have.property('base').and.to.equal('');
    });

	it('should add coverage button', function(){
		var button = $('.aui-button.codecov');
		expect(button.length).to.equal(1);
	});

	it('should add coverage classes', function() {
		expect($('.CodeMirror-code .line:nth-child(13)').hasClass('codecov-missed')).to.be.true;
	});

});
