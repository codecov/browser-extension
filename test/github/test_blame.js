$(function(){
    window.cc = new Github({
      "debug": true,
      "callback": mocha.run,
      "first_view": 'im',
      "enterprise": '',
      "debug_url": "https://github.com/codecov/codecov-python/blame/097f692a0f02649a80de6c98749ca32a126223fc/codecov/clover.py"
    });
});

var coverage = ['hit', null, 'hit', null, 'hit', 'hit', 'hit', 'hit', 'partial', 'missed', 'partial', 'missed',
                null, 'hit', null, 'partial', 'missed', null, 'hit', null, 'hit', null];
describe('gihub blame', function(){
  after(function(){save_coverage('gh-blame');});
  it('should start with no errors', function(){
      expect(window.cc.slug).to.equal('codecov/codecov-python');
      expect(window.cc.file).to.equal('codecov/clover.py');
      expect(window.cc.ref).to.equal('097f692a0f02649a80de6c98749ca32a126223fc');
      expect(window.cc.page).to.equal('blame');
      expect(window.cc.base).to.equal('');
  });
  it('should add coverage button', function(){
    var button = $('.file-actions .btn-group a.btn.codecov');
    expect(button.length).to.equal(1);
    expect(button.text()).to.equal('Coverage 60%');
    expect(button.attr('aria-label')).to.equal('Toggle Codecov (c)');
  });
  it('should still have all lines', function(){
    expect($('.file tr').length).to.equal(29);
  });
  it('button should be enabled', function(){
    expect($('.codecov.btn').hasClass('selected')).to.equal(true);
  });
  it('should add covered lines', function(){
    var x = 0;
    $('.file tr.blame-line').each(function(){
      if (coverage[x] === 'partial' || coverage[x] === 'missed') {
        expect($(this).find('td').hasClass('codecov-on')).to.equal(true);
      } else if (coverage[x] === 'hit') {
        expect($(this).find('td').hasClass('codecov-on')).to.equal(false);
      }
      x++;
    });
  });
  it('will toggle it', function(){
    click($('.codecov.btn')[0]);
    expect($('.codecov.btn').hasClass('selected')).to.equal(false);
    $('.file tr.blame-line').each(function(){
      expect($(this).find('td').hasClass('codecov-on')).to.equal(false);
    });
    click($('.codecov.btn')[0]);
    expect($('.codecov.btn').hasClass('selected')).to.equal(true);
    $('.file tr.blame-line').each(function(){
      expect($(this).find('td').hasClass('codecov-on')).to.equal(true);
    });
    click($('.codecov.btn')[0]);
    expect($('.codecov.btn').hasClass('selected')).to.equal(true);
    var x = 0;
    $('.file tr.blame-line').each(function(){
      if (coverage[x] === 'partial' || coverage[x] === 'missed') {
        expect($(this).find('td').hasClass('codecov-on')).to.equal(true);
      } else if (coverage[x] === 'hit') {
        expect($(this).find('td').hasClass('codecov-on')).to.equal(false);
      }
      x++;
    });
  });
});
