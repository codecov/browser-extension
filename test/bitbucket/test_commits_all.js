$(function(){
    window.cc = new Bitbucket({
      "debug": true,
      "callback": mocha.run,
      "first_view": 'im',
      "enterprise": '',
      "debug_url": "https://bitbucket.org/osallou/go-docker/commits/all?search=33a5c94583baf1fcc98db2c295c97283255163c1"
    });
});

describe('bitbucket commits all', function(){
  after(function(){save_coverage('bb-commits-all');});
  it('should start with no errors', function(){
    expect(window.cc).to.have.property('slug').and.to.equal('osallou/go-docker');
    expect(window.cc).to.have.property('ref').and.to.equal('all');
    expect(window.cc).to.have.property('page').and.to.equal('commits');
    expect(window.cc).to.have.property('base').and.to.equal('');
  });
  it('should add coverage button', function(){
    expect($('.commit-list thead th:eq(3)').hasClass('codecov')).to.be.true;
  });
  it('should add coverage button', function(){
    expect($('.commit-list tbody td:eq(3)').hasClass('codecov')).to.be.true;
    expect($('.commit-list tbody td.codecov').text()).to.equal('&uarr; 58.21%');
  });
});
