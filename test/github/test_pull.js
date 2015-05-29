$(function(){
    window.cc = new Github({
      "debug": true,
      "callback": mocha.run,
      "first_view": 'im',
      "enterprise": '',
      "debug_url": "https://github.com/codecov/codecov-python/pull/16"
    });
});

describe('github pull', function(){
  after(function(){save_coverage('gh-pull');});
  it('should start with no errors', function(){
      expect(window.cc.page).to.equal('pull');
      expect(window.cc.slug).to.equal('codecov/codecov-python');
      expect(window.cc.file).to.equal('');
      expect(window.cc.ref).to.equal('1d30954');
      expect(window.cc.base).to.equal("&base=3229ed3");
  });
  it('should add coverage button', function(){
    var button = $('.file-actions .btn-group a.btn.codecov');
    expect(button.length).to.equal(5);
    // expect(button.text()).to.equal('Coverage 60%');
    // expect(button.attr('aria-label')).to.equal('Toggle Codecov');
  });
  it('should still have all lines', function(){
    expect($('.file tr').length).to.equal(69);
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
