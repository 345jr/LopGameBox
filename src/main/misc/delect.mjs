import * as fs from 'fs/promises'
fs.unlink('apple.ts',(err)=>{
    if (err){
        console.log('发生错误')
        return
    }
    console.log('删除成功')
})