import React from 'react';
import { motion } from 'framer-motion';

// 1. 为父容器定义 Variants
// 主要目的是在 hover 状态时，为子元素的动画设置一个交错延迟 (staggerChildren)
const containerVariants = {
  // 初始状态，可以为空
  initial: {},
  // 悬停状态
  hover: {
    transition: {
      staggerChildren: 0.1, // 每个子元素动画依次延迟 0.1 秒
    },
  },
} as const;

// 2. 为子盒子定义 Variants
// 定义它们在不同状态下的样式
const boxVariants = {
  // 初始状态
  initial: {
    y: 0, // 垂直位置在原点
    backgroundColor: '#e0e0e0', // 初始颜色
  },
  // 悬停状态 (当父容器被 hover 时，子元素会自动应用这个状态)
  hover: {
    y: -30, // 向上移动 30px
    backgroundColor: '#0099ff', // 悬停颜色
    transition: {
      type: 'spring', // 使用弹簧动画，效果更自然
      stiffness: 300,
    },
  },
} as const;

// 3. 创建 React 组件
const HoverBoxes = () => {
  return (
    // 使用 motion.div 作为父容器，并应用 containerVariants
    <motion.div
      style={styles.container}
      variants={containerVariants}
      initial="initial"
      whileHover="hover" // 这是关键！当悬停时，自动切换到 "hover" 状态
    >
      {/* 下面的子盒子会自动继承父容器的状态。
        当父容器进入 "hover" 状态，它们也会去寻找自己的 "hover" variant 并执行动画。
      */}
      <motion.div style={styles.box} variants={boxVariants}></motion.div>
      <motion.div style={styles.box} variants={boxVariants}></motion.div>
      <motion.div style={styles.box} variants={boxVariants}></motion.div>
    </motion.div>
  );
};

// 简单的内联样式，让效果更明显
const styles = {
  container: {
    display: 'flex',
    gap: '20px', // 盒子之间的间距
    padding: '40px',
    backgroundColor: '#f0f0f0',
    borderRadius: '20px',
    cursor: 'pointer', // 提示用户这里可以交互
  },
  box: {
    width: '80px',
    height: '80px',
    borderRadius: '15px',
  },
};

export default HoverBoxes;