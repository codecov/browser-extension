var coverage = ['hit', null, 'hit', null, 'hit', 'hit', 'hit', 'hit', 'partial', 'miss', 'partial', 'miss',
                null, 'hit', null, 'partial', 'miss', null, 'hit', null, 'hit', null];
describe('codecov', function(){
  it('should start with no errors', function(done){
      var codecov = new Codecov({"debug": "https://github.com/codecov/codecov-python/blob/master/codecov/clover.py",
                                 "callback": done,
                                 "url": "https://codecov-staging.herokuapp.com"});
      expect(codecov.slug).to.equal('codecov/codecov-python');
      expect(codecov.ref).to.equal('4c95614d2aa78a74171f81fc4bf2c16a6d8b1cb5');
      expect(codecov.base).to.equal('');
  });
  it('should insert dist/github.css stylesheed', function(){
    // 2 becuse we ran new Codecov twice
    expect($('link[href*="dist/github.css"]').length).to.equal(2);
  });
  it('should add coverage button', function(){
    var button = $('.file-actions .button-group a.minibutton.codecov');
    expect(button.length).to.equal(1);
    expect(button.text()).to.equal('Coverage 60%');
    expect(button.attr('aria-label')).to.equal('Toggle Codecov');
  });
  it('should still have all lines', function(){
    expect($('tr').length).to.equal(21);
  });
  it('should add covered lines', function(){
    var x = 0;
    $('tr').each(function(){
      expect($('tr#L'+x).hasClass('codecov codecov-'+coverage[x])).to.equal(true);
      if (coverage[x] === 'partial' || coverage[x] === 'miss') {
        expect($('tr#L'+x).hasClass('codecov-on')).to.equal(true);
      }
      x++;
    });
  });
});

describe('clicking codecov', function(){
  it('first time should toggle off', function(){
    $('tr').each(function(){
      expect($('tr#L'+x).hasClass('codecov-on')).to.equal(false);
    });
  });
  it('second time should toggle on', function(){
    $('tr').each(function(){
      expect($('tr#L'+x).hasClass('codecov-on')).to.equal(true);
    });
  });
  it('third time should toggle partial/miss', function(){
    var x = 0;
    $('tr').each(function(){
      if (coverage[x] === 'partial' || coverage[x] === 'miss') {
        expect($('tr#L'+x).hasClass('codecov-on')).to.equal(true);
      } else {
        expect($('tr#L'+x).hasClass('codecov-on')).to.equal(false);
      }
      x++;
    });
  });
});
