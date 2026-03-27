CREATE DATABASE IF NOT EXISTS ai_copywriter 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE ai_copywriter;

CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `openid` VARCHAR(64) NOT NULL COMMENT '微信openid',
  `unionid` VARCHAR(64) DEFAULT NULL COMMENT '微信unionid',
  `nickname` VARCHAR(100) DEFAULT NULL COMMENT '用户昵称',
  `avatar` VARCHAR(500) DEFAULT NULL COMMENT '用户头像URL',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `gender` TINYINT DEFAULT 0 COMMENT '性别：0未知 1男 2女',
  `status` TINYINT DEFAULT 1 COMMENT '状态：1正常 2禁用',
  `daily_free_count` INT DEFAULT 3 COMMENT '每日免费次数',
  `total_generated` INT DEFAULT 0 COMMENT '累计生成次数',
  `last_login_at` DATETIME DEFAULT NULL COMMENT '最后登录时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_openid` (`openid`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

CREATE TABLE `members` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '会员ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `member_type` VARCHAR(20) NOT NULL COMMENT '会员类型：free免费 monthly月度 quarterly季度 yearly年度',
  `daily_limit` INT DEFAULT 3 COMMENT '每日生成次数限制',
  `expire_at` DATETIME DEFAULT NULL COMMENT '会员过期时间',
  `auto_renew` TINYINT DEFAULT 0 COMMENT '是否自动续费：0否 1是',
  `status` TINYINT DEFAULT 1 COMMENT '状态：1正常 2已过期 3已取消',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  KEY `idx_expire_at` (`expire_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会员表';

CREATE TABLE `contents` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `topic` VARCHAR(200) NOT NULL COMMENT '主题/关键词',
  `description` TEXT DEFAULT NULL COMMENT '内容描述',
  `style` VARCHAR(50) NOT NULL COMMENT '文案风格',
  `length` VARCHAR(20) NOT NULL COMMENT '文案长度：short中 medium长',
  `titles` JSON NOT NULL COMMENT '生成的标题（数组）',
  `content` TEXT NOT NULL COMMENT '正文内容',
  `tags` JSON DEFAULT NULL COMMENT '话题标签（数组）',
  `score` INT DEFAULT 0 COMMENT '爆款指数评分',
  `is_collected` TINYINT DEFAULT 0 COMMENT '是否收藏：0否 1是',
  `ai_model` VARCHAR(50) DEFAULT NULL COMMENT '使用的AI模型',
  `tokens_used` INT DEFAULT 0 COMMENT '消耗的tokens数',
  `generation_time` INT DEFAULT 0 COMMENT '生成耗时（毫秒）',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_is_collected` (`is_collected`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文案生成记录表';

CREATE TABLE `collections` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '收藏ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `content_id` BIGINT UNSIGNED NOT NULL COMMENT '文案ID',
  `folder` VARCHAR(50) DEFAULT 'default' COMMENT '收藏夹分类',
  `note` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_content` (`user_id`, `content_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收藏表';

CREATE TABLE `orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `order_no` VARCHAR(64) NOT NULL COMMENT '订单号',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `product_type` VARCHAR(50) NOT NULL COMMENT '产品类型',
  `product_name` VARCHAR(100) NOT NULL COMMENT '产品名称',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '订单金额',
  `pay_amount` DECIMAL(10,2) DEFAULT 0 COMMENT '实付金额',
  `payment_method` VARCHAR(20) DEFAULT 'wechat' COMMENT '支付方式',
  `transaction_id` VARCHAR(64) DEFAULT NULL COMMENT '微信支付交易号',
  `status` TINYINT DEFAULT 0 COMMENT '订单状态：0待支付 1已支付 2已取消 3已退款',
  `paid_at` DATETIME DEFAULT NULL COMMENT '支付时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';
