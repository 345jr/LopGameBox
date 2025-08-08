游戏列表
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={styles.th}>封面图</th>
            <th style={styles.th}>游戏名称</th>
            <th style={styles.th}>总游戏时长</th>
            <th style={styles.th}>启动次数</th>
            <th style={styles.th}>上次启动时间</th>
            <th style={styles.th}>游戏大小</th>
            {/* <th style={styles.th}>创建时间</th>
            <th style={styles.th}>更新时间</th> */}
            <th style={styles.th}>操作</th>
          </tr>
        </thead>
        <tbody>
          {games.map((game) => (
            <tr key={game.id}>
              {BannersRef.current?.find((i: Banners) => i.game_id === game.id) ? (
                <td style={styles.td}>
                  <img
                    src={'lop://' + BannersRef.current
                        ?.find((i: Banners) => i.game_id === game.id)
                        ?.relative_path?.replace(/\\/g, '/')
                        }
                    alt="banner图"
                    className="w-60 h-40"
                  />
                </td>
              ) : (
                <td style={styles.td}><img src="lop://banner/default.jpg" alt="默认封面图" className='w-60 h-40'/></td>
              )}

              <td style={styles.td} className='flex flex-col h-40'>
                <p className='mb-10'>{game.game_name}</p>
                <Portal gameId={game.id} updata={setGames}/>
                <button onClick={() => handleOpenGameFolder(game.launch_path)} >
                  <VscFolder />
                </button>                
              </td>

              <td style={styles.td}>{formatTime(game.total_play_time)}</td>
              <td style={styles.td}>{game.launch_count}</td>
              <td style={styles.td}>
                {game.last_launch_time
                  ? formatTimeCalender(game.last_launch_time)
                  : '暂无'}
              </td>
              <td style={styles.td}>{gameSizeFormat(game.disk_size)}</td>
              {/* <td style={styles.td}>{formatTimeCalender(game.created_at)}</td>
              <td style={styles.td}>{formatTimeCalender(game.updated_at)}</td> */}
              <td style={styles.td}>
                <button onClick={() => handleRunGame(game)}>运行</button>
                <button
                  onClick={() => handleDeleteGame(game)}
                  style={{ marginLeft: '10px' }}
                >
                  删除
                </button>
                <button
                  onClick={() => handleAddBanner(game)}
                  style={{ marginLeft: '10px' }}
                >
                  封面
                </button>
                <Link to={`/gallery/${game.id}`}>
                  <button>图集</button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {`消息通知 :${message}`}
      {elapsedTime ? `运行时间 :${formatTime(elapsedTime)}` : <></>}


      const styles: { th: React.CSSProperties; td: React.CSSProperties } = {
  th: {
    border: '1px solid #ccc',
    padding: '8px',
    textAlign: 'left',
    backgroundColor: '#f2f2f2',
  },
  td: { border: '1px solid #ccc', padding: '0px' },
};