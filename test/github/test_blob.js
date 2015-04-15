$(function(){
    window.cc = codecov({
      "debug": true,
      "callback": mocha.run,
      "first_view": 'im',
      "filename": "blob",
      "enterprise": '',
      "debug_url": "https://github.com/codecov/codecov-python/blob/097f692a0f02649a80de6c98749ca32a126223fc/codecov/clover.py"
    });
});

var coverage = ['hit', null, 'hit', null, 'hit', 'hit', 'hit', 'hit', 'partial', 'missed', 'partial', 'missed',
                null, 'hit', null, 'partial', 'missed', null, 'hit', null, 'hit', null];
describe('codecov', function(){
  it('should start with no errors', function(){
      expect(window.cc.slug).to.equal('codecov/codecov-python');
      expect(window.cc.file).to.equal('/codecov/clover.py');
      expect(window.cc.ref).to.equal('097f692a0f02649a80de6c98749ca32a126223fc');
      expect(window.cc.page).to.equal('blob');
      expect(window.cc.base).to.equal('');
  });
  it('should add coverage button', function(){
    var button = $('.file-actions .btn-group a.btn.codecov');
    expect(button.length).to.equal(1);
    expect(button.text()).to.equal('Coverage 60%');
    expect(button.attr('aria-label')).to.equal('Toggle Codecov (c)');
  });
  it('should still have all lines', function(){
    expect($('.file tr').length).to.equal(22);
  });
  it('should add covered lines', function(){
    expect($('.codecov.btn').hasClass('selected')).to.equal(true);
    var x = 0;
    $('.file tr').each(function(){
      expect($(this).find('td').hasClass('codecov codecov-'+coverage[x])).to.equal(true);
      if (coverage[x] === 'partial' || coverage[x] === 'missed') {
        expect($(this).find('td').hasClass('codecov-on')).to.equal(true);
      }
      x++;
    });
  });
});

describe('clicking codecov', function(){
  it('will toggle it', function(){
    // first click
    click($('.codecov.btn')[0]);
    expect($('.codecov.btn').hasClass('selected')).to.equal(false);
    $('.file tr').each(function(){
      expect($(this).find('td').hasClass('codecov-on')).to.equal(false);
    });
    // second click
    click($('.codecov.btn')[0]);
    expect($('.codecov.btn').hasClass('selected')).to.equal(true);
    $('.file tr').each(function(){
      expect($(this).find('td').hasClass('codecov-on')).to.equal(true);
    });
    // third click
    click($('.codecov.btn')[0]);
    expect($('.codecov.btn').hasClass('selected')).to.equal(true);
    var x = 0;
    $('.file tr').each(function(){
      if (coverage[x] === 'partial' || coverage[x] === 'missed') {
        expect($(this).find('td').hasClass('codecov-on')).to.equal(true);
      } else if (coverage[x] === 'hit') {
        expect($(this).find('td').hasClass('codecov-on')).to.equal(false);
      }
      x++;
    });
  });
});
