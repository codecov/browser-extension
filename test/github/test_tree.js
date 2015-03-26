describe('codecov', function(){
  it('should proper settings', function(){
      expect(window.codecov.page).to.equal('tree');
      expect(window.codecov.slug).to.equal('codecov/codecov-python');
      expect(window.codecov.file).to.equal('');
      expect(window.codecov.ref).to.equal('097f692a0f02649a80de6c98749ca32a126223fc');
      expect(window.codecov.base).to.equal("");
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
