$(function(){
    window.cc = new BitbucketServer({
      'debug': true,
      'callback': mocha.run,
      'overlay': true,
      'enterprise': '',
      'debug_url': 'http://localhost:7990/projects/TES/repos/gulp_starter/commits/7dec885055d274944da5501e7985a2d91a6dbb9e'
    });
});

describe('Bitbucket server commit', function() {
    it('Should start with no errors', function() {
	  expect(window.cc).to.have.property('slug').and.to.equal('TES/gulp_starter');
      expect(window.cc).to.have.property('ref').and.to.equal('7dec885055d274944da5501e7985a2d91a6dbb9e');
      expect(window.cc).to.have.property('page').and.to.equal('commits');
      expect(window.cc).to.have.property('base').and.to.equal('');
    });
});
