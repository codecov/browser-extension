$(function(){
    window.cc = new Bitbucket({
      "debug": true,
      "callback": mocha.run,
      "overlay": true,
      "enterprise": '',
      "debug_url": "https://bitbucket.org/osallou/go-docker/src/8c304f3171716b23f78dc6c1f6541b290a43386b/godocker/?at=master"
    });
});

describe('bitbucket tree', function(){
  after(function(){save_coverage('bb-tree');});
  it('should proper settings', function(){
    expect(window.cc).to.have.property('page').and.to.equal('src');
    expect(window.cc).to.have.property('slug').and.to.equal('osallou/go-docker');
    expect(window.cc).to.have.property('ref').and.to.equal('8c304f3171716b23f78dc6c1f6541b290a43386b');
  });
  // it('should add coverage header', function(){
  //   expect($('.commit-meta .sha-block.codecov').text()).to.equal('87%');
  // });
  it('should show coverage on files', function(){
    expect($('#source-container tr:eq(2) td.codecov').text()).to.equal('49.02%');
    expect($('#source-container tr:eq(3) td.codecov').text()).to.equal('57.14%');
    expect($('#source-container tr:eq(4) td.codecov').text()).to.equal('');
    expect($('#source-container tr:eq(5) td.codecov').text()).to.equal('19.01%');
  });
});
