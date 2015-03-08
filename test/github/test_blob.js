var coverage = ['hit', null, 'hit', null, 'hit', 'hit', 'hit', 'hit', 'partial', 'missed', 'partial', 'missed',
                null, 'hit', null, 'partial', 'missed', null, 'hit', null, 'hit', null];
describe('codecov', function(){
  it('should start with no errors', function(done){
      var codecov = new Codecov({"debug": "https://github.com/codecov/codecov-python/blob/master/codecov/clover.py",
                                 "callback": done});
      expect(codecov.slug).to.equal('codecov/codecov-python');
      expect(codecov.file).to.equal('/codecov/clover.py');
      expect(codecov.ref).to.equal('4c95614d2aa78a74171f81fc4bf2c16a6d8b1cb5');
      expect(codecov.base).to.equal('');
  });
  it('should insert dist/github.css stylesheed', function(){
    // 2 becuse we ran new Codecov twice
    expect($('link[href*="dist/github.css"]').length).to.not.equal(0);
  });
  it('should add coverage button', function(){
    var button = $('.file-actions .button-group a.minibutton.codecov');
    expect(button.length).to.equal(1);
    expect(button.text()).to.equal('Coverage 60%');
    expect(button.attr('aria-label')).to.equal('Toggle Codecov');
  });
  it('should still have all lines', function(){
    expect($('.file tr').length).to.equal(22);
  });
  it('should add covered lines', function(){
    expect($('.codecov.minibutton').hasClass('selected')).to.equal(true);
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
    click($('.codecov.minibutton')[0]);
    expect($('.codecov.minibutton').hasClass('selected')).to.equal(false);
    $('.file tr').each(function(){
      expect($(this).find('td').hasClass('codecov-on')).to.equal(false);
    });
    // first click
    click($('.codecov.minibutton')[0]);
    expect($('.codecov.minibutton').hasClass('selected')).to.equal(true);
    $('.file tr').each(function(){
      expect($(this).find('td').hasClass('codecov-on')).to.equal(true);
    });
    // first click
    click($('.codecov.minibutton')[0]);
    expect($('.codecov.minibutton').hasClass('selected')).to.equal(true);
    var x = 0;
    $('.file tr').each(function(){
      if (coverage[x] === 'partial' || coverage[x] === 'missed') {
        expect($(this).find('td').hasClass('codecov-on')).to.equal(true);
      } else if (coverage[x] === 'hit') {
        console.log(coverage[x], $(this).find('td').hasClass('codecov-on'));
        expect($(this).find('td').hasClass('codecov-on')).to.equal(false);
      }
      x++;
    });
  });
});
