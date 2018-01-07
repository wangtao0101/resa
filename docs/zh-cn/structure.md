# 项目结构

resa并不限制应用的项目结构，但是为了应用维护和调试，我们可以尽量遵循一定的规则：
* 使用combineModel组合同一层级的model
```
models
    ├── index.js   # 组合A模块和B模块
    ├── A.js       # A模块
    └── B.js       # B模块
```
* model的层次结构尽量和redux store一致
假设你设计的redux store结构如下：
```
└── resa
    └── model1
            ├── A = {...}
            └── B = {...}
    └── model2
            ├── C = {...}
            └── D = {...}
```
那么模型的文件结构可以如下：
```
└── resa
    └── model1
            ├── index.js # 组合模块
            ├── A.js
            └── B.js
    └── model2
            ├── index.js # 组合模块
            ├── C.js
            └── D.js
```
