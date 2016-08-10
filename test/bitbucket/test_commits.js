$(function(){
    window.cc = new Bitbucket({
      "debug": true,
      "callback": mocha.run,
      "overlay": true,
      "enterprise": '',
      "debug_url": "https://bitbucket.org/osallou/go-docker/commits/7766b261f7cefae31688636b830fd3497fc80c05"
    });
});

describe('bitbucket commit', function(){
  after(function(){save_coverage('bb-commits');});
  it('should start with no errors', function(){
    expect(window.cc).to.have.property('slug').and.to.equal('osallou/go-docker');
    expect(window.cc).to.have.property('ref').and.to.equal('7766b261f7cefae31688636b830fd3497fc80c05');
    expect(window.cc).to.have.property('page').and.to.equal('commits');
    expect(window.cc).to.have.property('base').and.to.equal('');
  });
  // it('shows coverage on individual files', function(){

  // });
  it('should add coverage button', function(){
    var button = $('a.aui-button.codecov');
    expect(button.length).to.equal(4);
    expect($('.line-numbers:eq(57)').hasClass('codecov-missed')).to.be.true;
    expect($('.line-numbers:eq(58)').hasClass('codecov')).to.be.false;
    expect($('.line-numbers:eq(59)').hasClass('codecov-hit')).to.be.true;
    // expect(button.attr('title')).to.equal('Toggle Codecov');
  });
  // it('should add covered lines', function(){
  //   expect($('.codecov.aui-button').hasClass('aui-button-light')).to.be.true;
  //   var x = 0;
  //   expect($("a[name=cl-70]").hasClass('codecov codecov-hit')).to.be.true;
  //   expect($("a[name=cl-71]").hasClass('codecov codecov-partial')).to.be.true;
  //   expect($("a[name=cl-74]").hasClass('codecov')).to.be.false;
  //   expect($("a[name=cl-75]").hasClass('codecov codecov-missed')).to.be.true;
  // });
  // it('will toggle it', function(){
  //   // first click
  //   click($('.codecov.aui-button')[0]);
  //   expect($('.codecov.aui-button').hasClass('aui-button-light')).to.be.false;
  //   expect($("a[name=cl-70]").hasClass('codecov-on')).to.be.false;
  //   expect($("a[name=cl-71]").hasClass('codecov-on')).to.be.false;
  //   expect($("a[name=cl-75]").hasClass('codecov-on')).to.be.false;
  //   // second click
  //   click($('.codecov.aui-button')[0]);
  //   expect($('.codecov.aui-button').hasClass('aui-button-light')).to.be.true;
  //   expect($("a[name=cl-70]").hasClass('codecov-on')).to.be.true;
  //   expect($("a[name=cl-71]").hasClass('codecov-on')).to.be.true;
  //   expect($("a[name=cl-75]").hasClass('codecov-on')).to.be.true;
  //   // third click
  //   click($('.codecov.aui-button')[0]);
  //   expect($('.codecov.aui-button').hasClass('aui-button-light')).to.be.true;
  //   expect($("a[name=cl-70]").hasClass('codecov-on')).to.be.false;
  //   expect($("a[name=cl-71]").hasClass('codecov-on')).to.be.true;
  //   expect($("a[name=cl-75]").hasClass('codecov-on')).to.be.true;
  // });
});
