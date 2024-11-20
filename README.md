# shu-room-use-data

基于 GitHub 的 SHU 教室占用情况数据爬虫，为 [鼠洞空教室查询](https://charging.shuhole.cn/room-use) 项目服务。

[![Interval Crawler Task](https://github.com/BH4HPA/shu-room-use-data/actions/workflows/interval-crawler-task.yml/badge.svg?branch=new-backend)](https://github.com/BH4HPA/shu-room-use-data/actions/workflows/interval-crawler-task.yml)

## 说明

### 项目适配后端

1. 上海大学教务管理(cj.shu.edu.cn)

   - https://cj.shu.edu.cn/RoomUse/RoomUseDate/
   - 需要登录查询，无需校园网
   - 查询速度较慢
   - 老系统，ASP 架构，前后端不分离

   适配该后端的代码位于 [main](https://github.com/BH4HPA/shu-room-use-data/tree/main) 分支，使用 Puppeteer 来模拟登录和查询，并通过构建 Docker 镜像部署在腾讯云的 Serverless 服务中，交由鼠洞后端每天定点调用来更新。

2. 2024 新版上海大学教务管理(jw.shu.edu.cn)

   - https://jw.shu.edu.cn/jwapp/sys/yjsrzfwapp/shuIndex.do?type=jsjyrqcxsy
   - 无需登录查询，需要校园网
   - 查询速度较快
   - 金智的新系统，前后端分离

   适配该后端的代码位于 [new-backend](https://github.com/BH4HPA/shu-room-use-data/tree/new-backend) 分支，使用 Axios 来直接请求数据，透过 OpenVPN 访问校园网，通过 GitHub Actions 定时调用来更新，并上传到腾讯云对象存储服务(COS)中。

### 数据结构

| 字段      | 类型    | 说明                                                                                                                                           |
| --------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| campus    | string  | 校区名称，以「校区」结尾，如「宝山校区」                                                                                                       |
| building  | string  | 教学楼名称，如「A」                                                                                                                            |
| classroom | string  | 教室名称，如「A101」                                                                                                                           |
| size      | number? | 教室容量，旧后端不含此字段，如「90」                                                                                                           |
| status    | number  | 教室占用情况，二进制位表示，从高位到低位每个位分别表示该节课（共 12 节课）是否被占用，1 表示占用，0 表示空闲，如「0b000000000000」表示全天空闲 |

### 数据获取方式

- 当日教室占用数据

  由鼠洞后端每天定点调用构建的数据

  `https://charging-api.ruivon.cn/v1/calendar/classroom`

- 指定 dayOfWeek（0-6）的教室占用数据

  由鼠洞后端缓存的数据

  `https://charging-api.ruivon.cn/v1/calendar/room-use/:dayOfWeek`

当前鼠洞后端采用 `new-backend` 分支爬虫产生的数据。

数据采用以下格式进行交付：

| 字段    | 类型     | 说明                                           |
| ------- | -------- | ---------------------------------------------- |
| code    | number   | 状态码，表示是否成功获取，目前只有 0（即成功） |
| infos   | object[] | 数据数组，即以前面提到的数据结构构建的数组     |
| message | string   | 状态码说明，目前只有「success」                |
| update  | number   | 该数据发布的时间戳，即数据更新时间             |

## 开发

以下介绍为 `new-backend` 分支进行开发的流程。

### GitHub Actions 开发

- Fork 为自己的项目
- 为项目添加以下 Action 的 Secrets
  - `SHU_USERNAME` 上海大学学工号
  - `SHU_PASSWORD` 上海大学统一身份认证密码
  - `QC_BUCKET` 腾讯云 COS Bucket 名称
  - `QC_REGION` 腾讯云 COS Bucket 所在地域
  - `QC_SECRET_ID` 腾讯云 COS Secret ID
  - `QC_SECRET_KEY` 腾讯云 COS Secret Key
- 进行开发，Push 到 GitHub 后会触发 Actions 进行爬虫任务

### 本地运行爬虫

- Git Clone 项目到本地
- 安装 Node.js 18.x
- 安装项目依赖

  ```bash
  corepack enable # 启用核心库来启用 yarn
  yarn install # 安装依赖
  ```

- 进行开发
- 运行爬虫

  ```bash
  yarn start
  ```

## 许可证

**代码：** [AGPL-3.0-or-later](https://github.com/shuosc/shu-course-data/main/LICENSE)

基于此项目提供服务，包括发布程序运行结果以供下载，**必须**
以相同许可证开源提供服务的源码和修改后的源码（如有）。

**数据：** [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)

使用数据的服务请标注本项目地址，禁止商用，演绎版本需以相同方式共享。

---

_获取数据或使用数据提供服务时，请遵守各地法律法规。请勿滥用。_
