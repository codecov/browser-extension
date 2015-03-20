describe('codecov', function(){
  it('should have accurate properties', function(){
      expect(window.codecov.slug).to.equal('codecov/codecov-python');
      expect(window.codecov.file).to.equal('');
      expect(window.codecov.ref).to.equal('4c95614');
      expect(window.codecov.base).to.equal('&base=fb55c9b');
  });
  it('should insert dist/github.css stylesheed', function(){
    // 2 becuse we ran new Codecov twice
    expect($('link[href*="dist/github.css"]').length).to.not.equal(0);
  });
  it('should add coverage button', function(){
    var buttons = $('.file-actions .btn-group a.btn.codecov');
    expect(buttons.length).to.equal(8);
    var text = ["Not covered", "Not covered", "Coverage 91%", "Coverage 60%", "Coverage 89%",
                "Coverage 78%", "Not covered", "Not covered"];
    buttons.each(function(){
      expect($(this).text()).to.equal(text.shift());
    });
  });
  it('should still have all lines', function(){
    expect($('.file tr').length).to.equal(218);
  });
  it('should not be shown', function(){
    expect($('.codecov-on').length).to.equal(0);
    expect($('.codecov.btn.selected').length).to.equal(0);
    expect($('.blob-num-deletion:visible').length).to.not.equal(0);
  });
  it('click will toggle coverage', function(){
    var file = $('.file-header[data-path="codecov/__init__.py"]');
    expect($('.codecov.btn', file).hasClass('selected')).to.equal(false);
    click($('.codecov.btn', file)[0]);
    expect($('.codecov.btn', file).hasClass('selected')).to.equal(true);
    expect(file.next().find('.blob-num-deletion:visible').length).to.equal(0);
    expect(file.next().find('.codecov:not(.codecov-on)').length).to.equal(0);
  });
});
