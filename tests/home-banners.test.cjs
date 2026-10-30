const test=require('node:test'),assert=require('node:assert/strict');
const {bannerModel}=require('../uadav-home-banners.js');
test('configured home banner accepts HTTPS and marks only the actual placeholder asset',()=>{
assert.equal(bannerModel({image_url:'https://example.test/assets/editorial/espacio-publicidad.svg',target_url:'https://example.test/mediakit'}).placeholder,true);
assert.equal(bannerModel({image_url:'https://example.test/image.jpg'}).placeholder,false);
});
test('home banners reject unsafe, disabled, legacy HTML-only and regional records',()=>{
for(const item of [{html:'<script>bad</script>'},{image_url:'javascript:bad'},{image_url:'https://user:secret@example.test/x'},{image_url:'https://example.test/x',target_url:'javascript:bad'},{image_url:'https://example.test/x',activo:false},{image_url:'https://example.test/x',provincia:'Santa Fe'},{image_url:'https://example.test/x',targeting:{province:'Santa Fe'}}])assert.equal(bannerModel(item),null);
});
