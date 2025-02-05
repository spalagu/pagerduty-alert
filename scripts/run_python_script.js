const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const isWindows = os.platform() === 'win32';
const pythonPath = path.join(process.cwd(), 'venv',
    isWindows ? 'Scripts' : 'bin',
    'python' + (isWindows ? '.exe' : ''));

const scriptPath = process.argv[2];
if (!scriptPath) {
    console.error('请指定要运行的 Python 脚本路径');
    process.exit(1);
}

// 运行 Python 脚本
const child = spawn(pythonPath, [scriptPath], {
    stdio: 'inherit',
    shell: true
});

child.on('exit', (code) => {
    if (code !== 0) {
        console.error('Python 脚本执行失败');
        process.exit(1);
    }
}); 