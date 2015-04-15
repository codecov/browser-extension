$(function(){
    window.cc = codecov({
      "debug": true,
      "callback": mocha.run,
      "first_view": 'im',
      "enterprise": '',
      "debug_url": "https://github.com/codecov/codecov-python/tree/097f692a0f02649a80de6c98749ca32a126223fc/codecov"
    });
});

describe('codecov', function(){
  it('should proper settings', function(){
      expect(window.cc.page).to.equal('tree');
      expect(window.cc.slug).to.equal('codecov/codecov-python');
      expect(window.cc.file).to.equal('');
      expect(window.cc.ref).to.equal('097f692a0f02649a80de6c98749ca32a126223fc');
      expect(window.cc.base).to.equal("");
  });
  it('should add coverage header', function(){
    expect($('.commit-meta .sha-block.codecov').text()).to.equal('87%');
  });
  it('should show coverage on files', function(){
    expect($('.file-wrap tr:eq(2) td:last span.codecov').text()).to.equal('92%');
    expect($('.file-wrap tr:eq(3) td:last span.codecov').text()).to.equal('60%');
    expect($('.file-wrap tr:eq(4) td:last span.codecov').text()).to.equal('88%');
    expect($('.file-wrap tr:eq(5) td:last span.codecov').text()).to.equal('77%');
  });
});
