export default function Loading() {
  return (
    <div className="fixed top-16 left-0 right-0 bottom-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-40">
      <div
        className="flex flex-col items-center gap-8"
        style={{
          animation: 'loading-float 3s ease-in-out infinite',
        }}
      >
        {/* メインのローディングリング */}
        <div className="relative">
          {/* 外側のリング */}
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 border-r-cyan-400"
            style={{
              width: '120px',
              height: '120px',
              animation: 'loading-spin 2s linear infinite',
              boxShadow:
                '0 0 30px rgba(3, 188, 244, 0.5), 0 0 60px rgba(3, 188, 244, 0.3), inset 0 0 20px rgba(3, 188, 244, 0.1)',
            }}
          />
          {/* 中間のリング */}
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-b-blue-400 border-l-blue-400"
            style={{
              width: '90px',
              height: '90px',
              top: '15px',
              left: '15px',
              animation: 'loading-spin 1.5s linear infinite reverse',
              boxShadow: '0 0 25px rgba(59, 130, 246, 0.4), 0 0 50px rgba(59, 130, 246, 0.2)',
            }}
          />
          {/* 内側のリング */}
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-300 border-r-cyan-300"
            style={{
              width: '60px',
              height: '60px',
              top: '30px',
              left: '30px',
              animation: 'loading-spin 1s linear infinite',
              boxShadow: '0 0 20px rgba(103, 232, 249, 0.5)',
            }}
          />
          {/* 中央のグロー */}
          <div
            className="absolute inset-0 rounded-full bg-cyan-400/20 blur-xl"
            style={{
              width: '40px',
              height: '40px',
              top: '40px',
              left: '40px',
              animation: 'loading-pulse 2s ease-in-out infinite',
            }}
          />
          {/* 中央の点 */}
          <div
            className="absolute inset-0 rounded-full bg-cyan-400"
            style={{
              width: '12px',
              height: '12px',
              top: '54px',
              left: '54px',
              boxShadow:
                '0 0 20px rgba(3, 188, 244, 1), 0 0 40px rgba(3, 188, 244, 0.8), 0 0 60px rgba(3, 188, 244, 0.5)',
              animation: 'loading-pulse 1.5s ease-in-out infinite',
            }}
          />
        </div>

        {/* テキスト */}
        <p
          className="text-lg font-medium text-white"
          style={{
            animation: 'loading-text-glow 2s ease-in-out infinite',
            textShadow:
              '0 0 10px rgba(3, 188, 244, 0.6), 0 0 20px rgba(3, 188, 244, 0.4), 0 0 30px rgba(3, 188, 244, 0.2)',
          }}
        >
          Loading...
        </p>
      </div>
    </div>
  );
}
