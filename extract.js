const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\Owner\\.gemini\\antigravity-ide\\brain\\c8a431f6-73e9-4205-a089-1c51d457f46b\\.system_generated\\steps\\1283\\content.md', 'utf8');
const match = content.match(/goog\.script\.init\((["']\\x7b.*?["'])\);/);
if (match) {
    const rawString = match[1];
    const decodedString = eval(rawString); // This evaluates "\x7b..." into a string
    try {
      const data = JSON.parse(decodedString);
      fs.writeFileSync('C:\\src\\PAC_KAWUNGANTEN\\appscript_ui.html', data.userHtml);
      console.log('Extracted appscript_ui.html');
    } catch (e) {
      console.error(e);
      console.log(decodedString.substring(0, 100));
    }
} else {
    console.log('Could not find init data');
}
