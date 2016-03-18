$(function(){
    window.cc = new Github({
      "debug": true,
      "callback": mocha.run,
      "overlay": true,
      "enterprise": '',
      "debug_url": "https://github.com/codecov/codecov-python/compare/codecov:21dcc07...codecov:4c95614"
    });
});

describe('github compare', function(){
  after(function(){save_coverage('gh-compare');});
  it('should have accurate properties', function(){
      expect(window.cc.slug).to.equal('codecov/codecov-python');
      expect(window.cc.file).to.equal(null);
      expect(window.cc.ref).to.equal('4c95614');
      expect(window.cc.base).to.equal('&base=fb55c9b');
  });
  it('should add coverage button', function(){
    var buttons = $('.file-actions .btn-group a.btn.codecov');
    expect(buttons.length).to.equal(8);
    var text = ["Not covered", "Not covered", "Coverage 89.17% (Diff 83.33%)", "Coverage 60.00% (Diff 50.00%)", "Coverage 88.89% (Diff 100%)",
                "Coverage 77.78% (Diff 73.33%)", "Not covered", "Not covered"];
    buttons.each(function(){
      expect($(this).text()).to.equal(text.shift());
    });
  });
  it('should show diff in toc header', function(){
    expect($('.toc-diff-stats .codecov').text()).to.equal(" 85.38% (Diff 77.14%)");
  });
  it('should show diff in toc', function(){
    expect($('a[href="#diff-ed4cb86e1f4a5c5feeecc37b90ec6a23"]').parent().find('.diffstat .codecov').text()).to.equal('89.17% (83.33%)');
    expect($('a[href="#diff-4b50cd5807f5f353de7e70825979d1be"]').parent().find('.diffstat .codecov').text()).to.equal('60.00% (50.00%)');
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
