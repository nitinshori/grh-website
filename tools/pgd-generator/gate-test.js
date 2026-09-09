// Proves the build-time gates refuse rather than warn. Not a document.
const {build}=require('./gen.js');
build({banner:'X',title:'Gate test',strap:'s',intro:[],arms:[],
 version:'v002',supersedes:'',changes:['Full clinical review and reissue.'],chDate:'x',
 appendix:[{text:'a — b'}]});
console.log('BUILD SUCCEEDED, WHICH IS A TEST FAILURE');
