describe('codecov', function(){
  it('should start with no errors', function(){
      expect(window.codecov.page).to.equal('pull');
      expect(window.codecov.slug).to.equal('codecov/codecov-python');
      expect(window.codecov.file).to.equal('');
      expect(window.codecov.ref).to.equal('1d30954');
      expect(window.codecov.base).to.equal("&base=3229ed3");
  });
  it('should insert dist/github.css stylesheed', function(){
    // 2 becuse we ran new Codecov twice
    expect($('link[href*="dist/github.css"]').length).to.not.equal(0);
  });
  it('should add coverage button', function(){
    var button = $('.file-actions .button-group a.minibutton.codecov');
    expect(button.length).to.equal(5);
    // expect(button.text()).to.equal('Coverage 60%');
    // expect(button.attr('aria-label')).to.equal('Toggle Codecov');
  });
  it('should still have all lines', function(){
    expect($('.file tr').length).to.equal(69);
  });
  it('should not be shown', function(){
    expect($('.codecov-on').length).to.equal(0);
    expect($('.codecov.minibutton.selected').length).to.equal(0);
    expect($('.blob-num-deletion:visible').length).to.not.equal(0);
  });
  it('click will toggle coverage', function(){
    var file = $('.file-header[data-path="codecov/__init__.py"]');
    expect($('.codecov.minibutton', file).hasClass('selected')).to.equal(false);
    click($('.codecov.minibutton', file)[0]);
    expect($('.codecov.minibutton', file).hasClass('selected')).to.equal(true);
    expect(file.next().find('.blob-num-deletion:visible').length).to.equal(0);
    expect(file.next().find('.codecov:not(.codecov-on)').length).to.equal(0);
  });
});
