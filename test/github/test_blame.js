var coverage = ['hit', null, 'hit', null, 'hit', 'hit', 'hit', 'hit', 'partial', 'missed', 'partial', 'missed',
                null, 'hit', null, 'partial', 'missed', null, 'hit', null, 'hit', null];
describe('codecov', function(){
  it('should start with no errors', function(){
      expect(window.codecov.slug).to.equal('codecov/codecov-python');
      expect(window.codecov.file).to.equal('/codecov/clover.py');
      expect(window.codecov.ref).to.equal('master');
      expect(window.codecov.page).to.equal('blame');
      expect(window.codecov.base).to.equal('');
  });
  it('should insert dist/github.css stylesheed', function(){
    // 2 becuse we ran new Codecov twice
    expect($('link[href*="dist/github.css"]').length).to.not.equal(0);
  });
  it('should add coverage button', function(){
    var button = $('.file-actions .button-group a.minibutton.codecov');
    expect(button.length).to.equal(1);
    expect(button.text()).to.equal('Coverage 60%');
    expect(button.attr('aria-label')).to.equal('Toggle Codecov (c)');
  });
  it('should still have all lines', function(){
    expect($('.file tr').length).to.equal(29);
  });
  it('should add covered lines', function(){
    expect($('.codecov.minibutton').hasClass('selected')).to.equal(false);
    var x = 0;
    $('.file tr.blame-line').each(function(){
      expect($(this).find('td').hasClass('codecov codecov-'+coverage[x])).to.equal(true);
      x++;
    });
  });
});

describe('clicking codecov', function(){
  it('will toggle it', function(){
    click($('.codecov.minibutton')[0]);
    expect($('.codecov.minibutton').hasClass('selected')).to.equal(true);
    $('.file tr.blame-line').each(function(){
      expect($(this).find('td').hasClass('codecov-on')).to.equal(true);
    });
    click($('.codecov.minibutton')[0]);
    expect($('.codecov.minibutton').hasClass('selected')).to.equal(true);
    var x = 0;
    $('.file tr.blame-line').each(function(){
      if (coverage[x] === 'partial' || coverage[x] === 'missed') {
        expect($(this).find('td').hasClass('codecov-on')).to.equal(true);
      } else if (coverage[x] === 'hit') {
        expect($(this).find('td').hasClass('codecov-on')).to.equal(false);
      }
      x++;
    });
    click($('.codecov.minibutton')[0]);
    expect($('.codecov.minibutton').hasClass('selected')).to.equal(false);
    $('.file tr.blame-line').each(function(){
      expect($(this).find('td').hasClass('codecov-on')).to.equal(false);
    });
  });
});
