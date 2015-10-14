$(function(){
    window.cc = new Github({
      "debug": true,
      "callback": mocha.run,
      "overlay": true,
      "enterprise": '',
      "debug_url": "https://github.com/codecov/codecov-python/tree/097f692a0f02649a80de6c98749ca32a126223fc/codecov"
    });
});

describe('github tree', function(){
  after(function(){save_coverage('gh-tree');});
  it('should proper settings', function(){
      expect(window.cc.page).to.equal('tree');
      expect(window.cc.slug).to.equal('codecov/codecov-python');
      expect(window.cc.file).to.equal(null);
      expect(window.cc.ref).to.equal('097f692a0f02649a80de6c98749ca32a126223fc');
      expect(window.cc.base).to.equal("");
  });
  it('should add coverage header', function(){
    expect($('.new-commit-tease .right .codecov').text()).to.equal('87.57%');
  });
  it('should show coverage on files', function(){
    expect($('.file-wrap tr:eq(2) td:last a.codecov').text()).to.equal('92.37%');
    expect($('.file-wrap tr:eq(3) td:last a.codecov').text()).to.equal('60.00%');
    expect($('.file-wrap tr:eq(4) td:last a.codecov').text()).to.equal('88.89%');
    expect($('.file-wrap tr:eq(5) td:last a.codecov').text()).to.equal('77.78%');
  });
});
