import { useRef, useState } from 'react';
import { VscPassFilled, VscFiles, VscArrowRight, VscClose } from 'react-icons/vsc';
import { motion } from 'motion/react';

import { Game, GameVersion } from '@renderer/types/Game';
import gameSizeFormat from '@renderer/util/gameSizeFormat';
import useInfoStore from '@renderer/store/infoStore';
import { Button, Modal } from 'antd';

export default function ModalContent({
  onClose,
  gameId,
  updata,
}: {
  onClose: () => void;
  gameId: number;
  updata: React.Dispatch<React.SetStateAction<any>>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [size, setSize] = useState<number>(0);
  const [currentCategory, setCurrentCategory] = useState<'playing' | 'archived' | 'all'>('all');

  const [gameVersions, setGameVersions] = useState<GameVersion[]>([]);

  // 从后端加载版本列表
  const loadVersions = async () => {
    try {
      const rows: any[] = await window.api.getVersionsByGame(gameId);
      const mapped: GameVersion[] = rows.map(
        (r) =>
          ({
            id: r.id,
            game_id: r.game_id,
            version: r.version,
            description: r.summary || r.description || '',
            release_date: (r.created_at || Date.now()) * 1000,
            created_at: (r.created_at || Date.now()) * 1000,
          }) as GameVersion,
      );
      setGameVersions(mapped);
    } catch (err) {
      console.error('加载版本列表失败', err);
    }
  };
  // 加载游戏当前分类
  const loadGameCategory = async () => {
    try {
      const game: Game = await window.api.getGameById(gameId);
      const category = (game as any).category || 'playing';
      // 只接受 playing 或 archived,其他情况默认为 playing
      if (category === 'playing' || category === 'archived') {
        setCurrentCategory(category);
      } else {
        setCurrentCategory('playing');
      }
    } catch (err) {
      console.error('加载游戏分类失败', err);
    }
  };

  // 在组件挂载时加载版本列表和游戏分类
  useState(() => {
    loadVersions();
    loadGameCategory();
  });

  

  const [selectedVersion, setSelectedVersion] = useState<GameVersion | null>(null);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  // 更新版本模态框状态
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateType, setUpdateType] = useState<'minor' | 'major'>('minor');
  const [updateSummary, setUpdateSummary] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [newGamePath, setNewGamePath] = useState<string>('');
  const [shouldRecalculateSize, setShouldRecalculateSize] = useState<boolean>(false);
  // 编辑版本描述相关状态
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');

  const setInfo = useInfoStore((state) => state.setInfo);

  // 打开版本详情模态框
  const handleVersionClick = (version: GameVersion) => {
    setSelectedVersion(version);
    setIsVersionModalOpen(true);
    setIsEditingDescription(false);
    setEditedDescription(version.description);
  };

  // 打开更新模态框（要求选择新的游戏路径）
  const openUpdateModal = async (type: 'minor' | 'major') => {
    // 打开文件选择对话框
    const selectedPath = await window.api.openFile();
    
    if (!selectedPath) {
      setInfo('未选择游戏路径，已取消更新');
      return;
    }
    
    setUpdateType(type);
    setUpdateSummary('');
    setNewGamePath(selectedPath);
    setShouldRecalculateSize(false);
    setSize(0);
    setIsUpdateModalOpen(true);
  };

  // 关闭版本详情模态框
  const handleVersionModalClose = () => {
    setIsVersionModalOpen(false);
    setSelectedVersion(null);
    setIsEditingDescription(false);
    setEditedDescription('');
  };

  // 开始编辑版本描述
  const handleStartEditDescription = () => {
    setIsEditingDescription(true);
  };

  // 取消编辑版本描述
  const handleCancelEditDescription = () => {
    setIsEditingDescription(false);
    setEditedDescription(selectedVersion?.description || '');
  };

  // 保存版本描述
  const handleSaveDescription = async () => {
    if (!selectedVersion) return;
    
    if (!editedDescription.trim()) {
      setInfo('版本描述不能为空');
      return;
    }

    try {
      const result = await window.api.updateVersionDescription(selectedVersion.id, editedDescription);
      if (result.success) {
        setInfo('版本描述更新成功');
        setIsEditingDescription(false);
        // 更新本地版本数据
        setSelectedVersion({ ...selectedVersion, description: editedDescription });
        // 重新加载版本列表
        await loadVersions();
      } else {
        setInfo(`更新失败: ${result.message}`);
      }
    } catch (err: any) {
      console.error('保存版本描述失败', err);
      setInfo(`保存失败: ${err?.message ?? String(err)}`);
    }
  };

  //修改游戏名
  const handleConfirm = async () => {
    const newName = inputRef.current?.value;
    if (newName) {
      // 调用修改游戏名的API
      await window.api.modifyGameName(gameId, newName);
      //重新获取数据
      const gameList = await window.api.getAllGames();
      updata(gameList);
      onClose();
      setInfo(`游戏名已修改为: ${newName}`);
    } else {
      onClose();
      setInfo(`游戏名不能为空!`);
    }
  };
  //重新计算游戏大小
  const handleGetGameSize = async (gameId: number) => {
    const game: Game = await window.api.getGameById(gameId);
    //更新游戏大小
    const newSize = await window.api.updateGameSize(gameId, game.launch_path);
    setSize(newSize);
    //重新获取数据
    const newGameList = await window.api.getAllGames();
    updata(newGameList);
  };

  // 更新游戏分类
  const handleUpdateCategory = async (category: 'playing' | 'archived') => {
    try {
      const result = await window.api.updateGameCategory(gameId, category);
      if (result.success) {
        setCurrentCategory(category);
        setInfo(`分类已更新为: ${category === 'playing' ? '攻略中' : '已归档'}`);
        // 重新获取数据
        const newGameList = await window.api.getAllGames();
        updata(newGameList);
      } else {
        setInfo(`更新失败: ${result.message}`);
      }
    } catch (err: any) {
      console.error('更新游戏分类失败', err);
      setInfo(`更新失败: ${err?.message ?? String(err)}`);
    }
  };

  // 手动计算游戏大小（在模态框中触发）
  const handleRecalculateSizeInModal = async () => {
    if (!newGamePath) {
      setInfo('未选择游戏路径');
      return;
    }
    try {
      const calculatedSize = await window.api.updateGameSize(gameId, newGamePath);
      setSize(calculatedSize);
      setShouldRecalculateSize(true);
      setInfo('游戏大小计算完成');
    } catch (err: any) {
      console.error('计算游戏大小失败', err);
      setInfo(`计算失败: ${err?.message ?? String(err)}`);
    }
  };

  // 确认提交更新（调用主进程接口）
  const handleConfirmUpdate = async () => {
    if (!updateSummary) {
      setInfo('请填写更新概述');
      return;
    }
    if (!newGamePath) {
      setInfo('未选择游戏路径');
      return;
    }
    setIsUpdating(true);
    try {
      // 如果用户选择了重新计算游戏大小，则传入 size，否则传 undefined
      const gameSizeToSubmit = shouldRecalculateSize ? size : undefined;
      
      // 先更新游戏路径
      const pathUpdateResult = await window.api.updateGamePath(gameId, newGamePath);
      if (!pathUpdateResult.success) {
        setInfo(`路径更新失败: ${pathUpdateResult.message}`);
        setIsUpdating(false);
        return;
      }
      
      // 然后创建新版本
      const inserted: any = await window.api.updateGameVersion(
        gameId,
        updateType,
        updateSummary,
        gameSizeToSubmit,
      );
      
      // 插入到本地版本列表（前端使用的字段名与后端可能不同，做映射）
      const newVersion: GameVersion = {
        id: inserted.id || Date.now(),
        game_id: gameId,
        version: inserted.version || `${inserted.version}`,
        description: inserted.summary || updateSummary,
        release_date: Date.now(),
        created_at: inserted.created_at ? inserted.created_at * 1000 : Date.now(),
      } as any;
      
      // 重新拉取所有版本并刷新游戏列表
      await loadVersions();
      const newGameList = await window.api.getAllGames();
      updata(newGameList);
      setInfo(`已创建新版本 ${newVersion.version}，游戏路径已更新`);
      setIsUpdateModalOpen(false);
    } catch (err: any) {
      console.error('更新版本失败', err);
      setInfo(`更新失败: ${err?.message ?? String(err)}`);
    } finally {
      setIsUpdating(false);
    }
  };
  return (
    // 遮罩层
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800/30"
      onClick={onClose}
    >
      {/* 模态框主体 */}
      <div
        className="relative mx-4 w-full max-w-150 rounded-lg bg-white p-6 shadow-xl"
        // 阻止点击内容时关闭
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-1 text-2xl font-semibold text-gray-800">配置区域</p>
        {/* 修改游戏名 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div>
              <p className="py-2 text-lg">修改游戏名</p>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="点击右侧保存"
                  className="mb-1 w-full rounded border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button onClick={handleConfirm} className="absolute top-1.5 right-2 cursor-pointer">
                  <VscPassFilled className="text-3xl text-lime-500" />
                </button>
              </div>
            </div>
            {/* 重新扫描游戏大小 */}
            <div className="flex flex-row">
              <p className="py-2 text-lg">重新计算游戏大小</p>
              <VscArrowRight className="mx-2 mt-2.5 text-2xl" />
              <motion.button
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.5, color: '#fcad03' }}
                onClick={() => handleGetGameSize(gameId)}
              >
                <VscFiles className="cursor-pointer text-2xl" />
              </motion.button>
              {/* 展示新的游戏大小 */}
              {size > 0 && (
                <>
                  <VscArrowRight className="mx-2 mt-2.5 text-2xl" />
                  <p className="mt-2.5 ml-2 text-lg text-black">游戏大小:{gameSizeFormat(size)}</p>
                </>
              )}
            </div>
            {/* 设置游戏分类 */}
            <div className="mt-4">
              <p className="py-2 text-lg">设置游戏分类</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateCategory('playing')}
                  className={`flex-1 rounded-md px-3 py-2 text-sm transition-all ${
                    currentCategory === 'playing'
                      ? 'bg-blue-500 text-white font-semibold'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  攻略中
                </button>
                <button
                  onClick={() => handleUpdateCategory('archived')}
                  className={`flex-1 rounded-md px-3 py-2 text-sm transition-all ${
                    currentCategory === 'archived'
                      ? 'bg-blue-500 text-white font-semibold'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  已归档
                </button>
              </div>
            </div>
          </div>
          {/* 版本管理 */}
          <div>
            <p className="py-2 text-center text-lg">更新版本记录</p>
            <div className="flex flex-row justify-center gap-4">
              <Button color="primary" variant="filled" onClick={() => openUpdateModal('major')}>
                大更新
              </Button>
              <Button color="primary" variant="filled" onClick={() => openUpdateModal('minor')}>
                小更新
              </Button>
            </div>
            <div className="mt-4">
              <p className="mb-2 text-lg font-semibold">版本列表:</p>
              {gameVersions && gameVersions.length > 0 ? (
                <div className="space-y-1">
                  {gameVersions.map((version) => (
                    <div
                      key={version.id}
                      className="flex cursor-pointer items-center justify-between py-1 transition-colors hover:text-blue-600"
                      onClick={() => handleVersionClick(version)}
                    >
                      <span className="font-medium">版本 {version.version}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(version.release_date).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">暂无版本记录</p>
              )}
            </div>
          </div>
        </div>

        {/* 版本详情模态框 */}
        <Modal
          title={`版本详情`}
          open={isVersionModalOpen}
          onCancel={handleVersionModalClose}
          footer={[
            isEditingDescription ? (
              <>
                <Button key="cancel-edit" onClick={handleCancelEditDescription}>
                  取消编辑
                </Button>
                <Button key="save" type="primary" onClick={handleSaveDescription}>
                  保存
                </Button>
              </>
            ) : (
              <>
                <Button key="edit" type="default" onClick={handleStartEditDescription}>
                  编辑描述
                </Button>
                <Button key="close" onClick={handleVersionModalClose}>
                  关闭
                </Button>
              </>
            ),
          ]}
          width={600}
        >
          {selectedVersion && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="font-semibold text-gray-700">版本号</p>
                  <p className="text-gray-900">{selectedVersion.version}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">发布日期</p>
                  <p className="text-gray-900">
                    {new Date(selectedVersion.release_date).toLocaleString('zh-CN')}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">创建时间</p>
                  <p className="text-gray-900">
                    {new Date(selectedVersion.created_at).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-700">版本描述</p>
                {isEditingDescription ? (
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="w-full rounded border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    rows={4}
                    placeholder="请输入版本描述..."
                  />
                ) : (
                  <p className="text-gray-900">{selectedVersion.description}</p>
                )}
              </div>
            </div>
          )}
        </Modal>
        {/* 提交更新的模态框 */}
        <Modal
          title={updateType === 'major' ? '创建大更新' : '创建小更新'}
          open={isUpdateModalOpen}
          onCancel={() => setIsUpdateModalOpen(false)}
          footer={[
            <Button key="cancel" onClick={() => setIsUpdateModalOpen(false)}>
              取消
            </Button>,
            <Button
              key="submit"
              type="primary"
              loading={isUpdating}
              onClick={handleConfirmUpdate}
            >
              确定
            </Button>
          ]}
        >
          <div className="space-y-4">
            <div>
              <p className="font-medium">新游戏路径：</p>
              <p className="text-sm text-gray-600 break-all">{newGamePath || '未选择'}</p>
            </div>
            <div>
              <p className="font-medium">重新计算游戏大小（可选）：</p>
              <div className="flex items-center gap-2">
                <Button onClick={handleRecalculateSizeInModal}>
                  {size > 0 ? '重新计算' : '计算游戏大小'}
                </Button>
                {size > 0 && (
                  <span className="text-sm text-gray-600">
                    当前大小: {gameSizeFormat(size)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                提示：如果不计算游戏大小，版本记录将不包含文件大小信息
              </p>
            </div>
            <div>
              <p className="font-medium">更新概述（必填）</p>
              <textarea
                value={updateSummary}
                onChange={(e) => setUpdateSummary(e.target.value)}
                className="w-full rounded border p-2"
                rows={4}
                placeholder="请描述本次更新的内容..."
              />
            </div>
          </div>
        </Modal>
        <div className="absolute top-4 right-4">
          <button
            onClick={onClose}
            className="transform cursor-pointer rounded px-4 py-2 text-gray-800 transition duration-200 ease-in-out hover:text-red-500"
          >
            <VscClose className="text-2xl" />
          </button>
        </div>
      </div>
    </div>
  );
}
