const { spawnSync } = require('child_process');
const path = require('path');

console.log('正在设置 Python 环境...');

const result = spawnSync('npm', ['run', 'setup:python'], {
    stdio: 'inherit',
    shell: true
});

if (result.status !== 0) {
    console.error('Python 环境设置失败');
    process.exit(1);
}

console.log('环境设置完成！'); 