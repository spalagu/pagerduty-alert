const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const isWindows = os.platform() === 'win32';
const scriptExt = isWindows ? '.bat' : '.sh';
const scriptPath = path.join(__dirname, `setup_python_env${scriptExt}`);

// 设置脚本为可执行（仅在非 Windows 系统）
if (!isWindows) {
    require('fs').chmodSync(scriptPath, '755');
}

// 运行脚本
const child = spawn(scriptPath, [], {
    stdio: 'inherit',
    shell: true
});

child.on('exit', (code) => {
    if (code !== 0) {
        console.error('Python 环境设置失败');
        process.exit(1);
    }
}); 