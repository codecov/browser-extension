describe('codecov', function(){
  it('should proper settings', function(){
      expect(window.codecov.page).to.equal('find');
      expect(window.codecov.slug).to.equal('codecov/codecov-python');
      expect(window.codecov.file).to.equal('');
      expect(window.codecov.ref).to.equal('master');
      expect(window.codecov.base).to.equal("");
  });
  it('should add coverage header', function(){
    expect($('.commit.commit-tease.codecov').length).to.equal(1);
  });
  it('should show coverage on files', function(){
    expect($('#tree-finder-results tr:eq(7) td:last span.codecov').text()).to.equal('92%');
    expect($('#tree-finder-results tr:eq(8) td:last span.codecov').text()).to.equal('60%');
    expect($('#tree-finder-results tr:eq(9) td:last span.codecov').text()).to.equal('89%');
    expect($('#tree-finder-results tr:eq(10) td:last span.codecov').text()).to.equal('78%');
  });
  it('should add coverage when query changes', function(){
    $('#tree-finder-field').val('clover').trigger('keyup');
    expect($('#tree-finder-results tr:eq(1) td:last span.codecov').text()).to.equal('60%');
  });
});
