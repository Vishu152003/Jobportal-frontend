import { motion } from 'framer-motion';

const Loader = ({ type = 'spinner', count = 5, className = '' }) => {
  const spinner = (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full"
    />
  );

  const skeletonCard = (
    <motion.div
      initial={{ opacity: 0.4 }}
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 animate-pulse"
    >
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
      </div>
    </motion.div>
  );

  const skeletonJobCard = (
    <motion.div
      initial={{ opacity: 0.4 }}
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 animate-pulse border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl animate-pulse"></div>
        <div className="flex-1 space-y-2">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="flex gap-3">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>
        </div>
      </div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
      <div className="flex gap-2">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl w-24 flex-1"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl w-20"></div>
      </div>
    </motion.div>
  );

  const skeletonStats = (
    <motion.div
      initial={{ opacity: 0.4 }}
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 animate-pulse"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
      </div>
    </motion.div>
  );

  const renderSkeletons = () => {
    switch (type) {
      case 'stats':
        return Array.from({ length: count }, (_, i) => (
          <div key={i} className="col-span-1">
            {skeletonStats}
          </div>
        ));
      case 'job-list':
        return Array.from({ length: count }, (_, i) => (
          <div key={i}>{skeletonJobCard}</div>
        ));
      case 'list':
      default:
        return Array.from({ length: count }, (_, i) => (
          <div key={i}>{skeletonCard}</div>
        ));
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center py-20 ${className}`}>
      {type === 'spinner' ? (
        spinner
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
          {renderSkeletons()}
        </div>
      )}
      <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm font-medium">Loading...</p>
    </div>
  );
};

export default Loader;
