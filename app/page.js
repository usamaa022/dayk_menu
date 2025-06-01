'use client'
import { useState, useEffect } from 'react';
import { FiUser, FiLock, FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter, FiX, FiCheck, FiLogOut, FiImage, FiUpload } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, writeBatch } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import imageCompression from 'browser-image-compression';

// Notification Component
const Notification = ({ message, type, onClose }) => {
  const icons = {
    success: <FiCheck className="text-green-600" />,
    error: <FiX className="text-red-600" />,
    info: <FiUser className="text-blue-600" />,
    warning: <FiImage className="text-yellow-600" />
  };

  const colors = {
    success: 'bg-green-50 border-l-4 border-green-500',
    error: 'bg-red-50 border-l-4 border-red-500',
    info: 'bg-blue-50 border-l-4 border-blue-500',
    warning: 'bg-yellow-50 border-l-4 border-yellow-500'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className={`${colors[type]} rounded-lg shadow-lg p-4 mb-4 flex items-center`}
    >
      <div className="mr-3 text-xl">{icons[type]}</div>
      <div className="flex-1">
        <p className="text-gray-900 font-medium">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="ml-3 text-gray-600 hover:text-gray-800"
      >
        <FiX size={16} />
      </button>
    </motion.div>
  );
};

// Notification System
const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return {
    addNotification,
    NotificationContainer: () => (
      <div className="fixed top-4 right-4 z-50 w-80">
        <AnimatePresence>
          {notifications.map(notification => (
            <Notification
              key={notification.id}
              message={notification.message}
              type={notification.type}
              onClose={() => removeNotification(notification.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    )
  };
};

// Image Modal Component
const ImageModal = ({ image, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="max-w-full max-h-full"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={image}
          alt="Enlarged view"
          className="max-w-full max-h-[80vh] object-contain"
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition"
        >
          <FiX size={24} />
        </button>
      </motion.div>
    </motion.div>
  );
};

// Login Page Component
const LoginPage = ({ onLogin, addNotification }) => {
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  const handleLoginFormChange = (e) => {
    const { name, value } = e.target;
    setLoginForm({ ...loginForm, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(loginForm);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-700 mb-2">Dayk Pharmacy</h1>
          <p className="text-gray-600">Please login to continue</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-gray-900 text-sm font-medium mb-1" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={loginForm.email}
              onChange={handleLoginFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              required
            />
          </div>
          <div className="mb-8">
            <label className="block text-gray-900 text-sm font-medium mb-1" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={loginForm.password}
              onChange={handleLoginFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              required
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Login
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default function PharmacySupplementManager() {
  // Notification system
  const { addNotification, NotificationContainer } = NotificationSystem();
  const auth = getAuth();

  // Authentication state
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  // Product state
  const [supplements, setSupplements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(['All']);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Admin panel state
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editSupplement, setEditSupplement] = useState(null);
  const [newCategory, setNewCategory] = useState('');
  const [supplementForm, setSupplementForm] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    barcode: '',
    category: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Initialize Firebase data and auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Check if user is admin (you might want to implement a more secure way)
        const adminEmails = ['dryassin@gmail.com']; // Add your admin emails here
        setIsAdmin(adminEmails.includes(user.email));
        await fetchData();
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    const fetchData = async () => {
      try {
        // Fetch supplements
        const supplementsSnapshot = await getDocs(collection(db, "supplements"));
        const supplementsData = supplementsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSupplements(supplementsData);

        // Fetch categories
        const categoriesSnapshot = await getDocs(collection(db, "categories"));
        const categoriesData = categoriesSnapshot.docs.map(doc => doc.data().name);
        setCategories(['All', ...new Set(categoriesData)]);
      } catch (error) {
        console.error("Error fetching data: ", error);
        addNotification('Failed to load data', 'error');
      }
    };

    return () => unsubscribe();
  }, [auth]);

  // Filtered supplements based on search and category
  const filteredSupplements = supplements.filter(supplement => {
    const matchesSearch = supplement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplement.barcode.includes(searchTerm);
    const matchesCategory = selectedCategory === 'All' || supplement.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Format price as IQD in English format
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Convert file to Base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Function to process and store image as Base64
  const uploadImageToPublic = async (file) => {
    if (!file) return null;

    setUploadingImage(true);

    try {
      // Compress the image
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      // Convert to Base64 string
      const base64Image = await convertToBase64(compressedFile);

      addNotification('Image processed successfully', 'success');
      return base64Image;
    } catch (error) {
      console.error("Error processing image:", error);
      addNotification(error.message || "Failed to process image", "error");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // Authentication functions
  const handleLogin = async (credentials) => {
    try {
      await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      addNotification('Login successful', 'success');
    } catch (error) {
      console.error("Login error:", error);
      addNotification('Invalid credentials', 'error');
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      addNotification('Logged out successfully', 'info');
    } catch (error) {
      console.error("Logout error:", error);
      addNotification('Failed to logout', 'error');
    }
  };

  // Admin functions
  const handleAddSupplement = async (e) => {
    e.preventDefault();

    if (!supplementForm.name || !supplementForm.price || !supplementForm.barcode) {
      addNotification("Please fill in all required fields", "error");
      return;
    }

    if (supplements.some((s) => s.barcode === supplementForm.barcode)) {
      addNotification("A supplement with this barcode already exists", "error");
      return;
    }

    try {
      let imageBase64 = null;

      // Handle image upload if there's a new image
      if (supplementForm.image instanceof File) {
        imageBase64 = await uploadImageToPublic(supplementForm.image);
        if (!imageBase64) {
          addNotification("Image processing failed", "error");
          return;
        }
      }

      // Save to Firestore
      const docRef = await addDoc(collection(db, "supplements"), {
        name: supplementForm.name,
        description: supplementForm.description,
        price: parseInt(supplementForm.price.replace(/\D/g, "")) || 0,
        quantity: parseInt(supplementForm.quantity.replace(/\D/g, "")) || 0,
        barcode: supplementForm.barcode,
        category: supplementForm.category || categories[1] || 'General',
        image: imageBase64 || null,
        createdAt: new Date(),
      });

      // Update local state
      setSupplements([
        ...supplements,
        {
          id: docRef.id,
          ...supplementForm,
          price: parseInt(supplementForm.price.replace(/\D/g, "")) || 0,
          quantity: parseInt(supplementForm.quantity.replace(/\D/g, "")) || 0,
          image: imageBase64 || null,
          category: supplementForm.category || categories[1] || 'General',
        },
      ]);

      resetSupplementForm();
      addNotification("Supplement added successfully", "success");
      setShowAdminPanel(false);
    } catch (error) {
      console.error("Error adding supplement: ", error);
      addNotification("Failed to add supplement", "error");
    }
  };

  const handleUpdateSupplement = async (e) => {
    e.preventDefault();
    if (!supplementForm.name || !supplementForm.price || !supplementForm.barcode) {
      addNotification('Please fill in all required fields', 'error');
      return;
    }

    if (supplements.some(s => s.barcode === supplementForm.barcode && s.id !== editSupplement.id)) {
      addNotification('A supplement with this barcode already exists', 'error');
      return;
    }

    try {
      let imageBase64 = editSupplement.image;

      // Handle new image upload if there's a file
      if (supplementForm.image instanceof File) {
        imageBase64 = await uploadImageToPublic(supplementForm.image);
        if (!imageBase64) {
          addNotification("Image processing failed", "error");
          return;
        }
      } else if (typeof supplementForm.image === 'string') {
        // Keep existing image if no new file was selected
        imageBase64 = supplementForm.image;
      } else {
        imageBase64 = null;
      }

      await updateDoc(doc(db, "supplements", editSupplement.id), {
        name: supplementForm.name,
        description: supplementForm.description,
        price: parseInt(supplementForm.price.replace(/\D/g, '')) || 0,
        quantity: parseInt(supplementForm.quantity.replace(/\D/g, '')) || 0,
        barcode: supplementForm.barcode,
        category: supplementForm.category || editSupplement.category || 'General',
        image: imageBase64,
        updatedAt: new Date(),
      });

      setSupplements(supplements.map(supplement =>
        supplement.id === editSupplement.id ? {
          ...supplementForm,
          id: editSupplement.id,
          price: parseInt(supplementForm.price.replace(/\D/g, '')) || 0,
          quantity: parseInt(supplementForm.quantity.replace(/\D/g, '')) || 0,
          image: imageBase64,
          category: supplementForm.category || editSupplement.category || 'General',
        } : supplement
      ));

      resetSupplementForm();
      setEditSupplement(null);
      addNotification('Supplement updated successfully', 'success');
      setShowAdminPanel(false);
    } catch (error) {
      console.error("Error updating supplement: ", error);
      addNotification('Failed to update supplement', 'error');
    }
  };

  const handleDeleteSupplement = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplement?')) {
      try {
        // Delete from Firestore
        await deleteDoc(doc(db, "supplements", id));

        // Update local state
        setSupplements(supplements.filter(supplement => supplement.id !== id));
        addNotification('Supplement deleted successfully', 'success');
      } catch (error) {
        console.error("Error deleting supplement: ", error);
        addNotification('Failed to delete supplement', 'error');
      }
    }
  };

  // Category management functions
  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      addNotification('Please enter a category name', 'error');
      return;
    }

    if (categories.includes(newCategory)) {
      addNotification('Category already exists', 'error');
      return;
    }

    try {
      // Add to Firestore
      await addDoc(collection(db, "categories"), {
        name: newCategory.trim(),
        createdAt: new Date()
      });

      // Update local state
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
      addNotification('Category added successfully', 'success');
    } catch (error) {
      console.error("Error adding category: ", error);
      addNotification('Failed to add category', 'error');
    }
  };

  const handleDeleteCategory = async (category) => {
    if (category === 'All') {
      addNotification('Cannot delete the default category', 'error');
      return;
    }

    if (window.confirm(`Are you sure you want to delete the category "${category}"?`)) {
      try {
        // First, update all supplements with this category to 'General'
        const batch = writeBatch(db);
        const supplementsRef = collection(db, "supplements");
        const q = query(supplementsRef, where("category", "==", category));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
          batch.update(doc.ref, { category: 'General' });
        });

        // Then delete the category
        const categoriesRef = collection(db, "categories");
        const categoriesQuery = query(categoriesRef, where("name", "==", category));
        const categoriesSnapshot = await getDocs(categoriesQuery);

        categoriesSnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();

        // Update local state
        setCategories(categories.filter(c => c !== category));
        setSupplements(supplements.map(supplement =>
          supplement.category === category ? { ...supplement, category: 'General' } : supplement
        ));
        addNotification('Category deleted successfully', 'success');
      } catch (error) {
        console.error("Error deleting category: ", error);
        addNotification('Failed to delete category', 'error');
      }
    }
  };

  const resetSupplementForm = () => {
    setSupplementForm({
      name: '',
      description: '',
      price: '',
      quantity: '',
      barcode: '',
      category: categories.length > 1 ? categories[1] : 'General',
      image: null
    });
    setImagePreview(null);
  };

  const handleSupplementFormChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'image') {
      const file = files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        addNotification('Please upload an image file', 'error');
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        addNotification('Image must be smaller than 5MB', 'error');
        return;
      }

      setSupplementForm({ ...supplementForm, image: file });
      setImagePreview(URL.createObjectURL(file));
    } else if ((name === 'price' || name === 'quantity') && value !== '') {
      const numericValue = value.replace(/\D/g, '');
      setSupplementForm({ ...supplementForm, [name]: numericValue });
    } else {
      setSupplementForm({ ...supplementForm, [name]: value });
    }
  };

  // Render supplement image
  const renderSupplementImage = (supplement) => {
    if (!supplement.image) {
      return (
        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-600">No image available</span>
        </div>
      );
    }

    return (
      <div
        className="w-full h-48 bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={() => {
          setSelectedImage(supplement.image);
          setShowImageModal(true);
        }}
      >
        <img
          src={supplement.image}
          alt={supplement.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  };

  // Modal animation
  const modalVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-900">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} addNotification={addNotification} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <NotificationContainer />

      {/* Image Modal */}
      <AnimatePresence>
        {showImageModal && (
          <ImageModal
            image={selectedImage}
            onClose={() => setShowImageModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="bg-white shadow-sm sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-indigo-700"
          >
            Dayk Pharmacy
          </motion.h1>

          <div className="flex items-center space-x-4">
            {user && (
              <>
                {isAdmin && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setShowAdminPanel(true);
                        resetSupplementForm();
                      }}
                      className="flex items-center space-x-1 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition"
                    >
                      <FiPlus size={18} />
                      <span className="hidden sm:inline">Add Product</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowCategoryManager(true)}
                      className="flex items-center space-x-1 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition"
                    >
                      <FiFilter size={18} />
                      <span className="hidden sm:inline">Manage Categories</span>
                    </motion.button>
                  </>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="flex items-center space-x-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition"
                >
                  <FiLogOut size={18} />
                  <span className="hidden sm:inline">Logout</span>
                </motion.button>
              </>
            )}
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 bg-white rounded-xl shadow-md p-4"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-600" />
              </div>
              <input
                type="text"
                placeholder="Search by name or barcode..."
                className="pl-10 pr-4 text-gray-500 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50"
              >
                <FiFilter className="text-gray-600" />
                <span className="text-gray-900">{selectedCategory}</span>
              </button>
              <AnimatePresence>
                {showFilterDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20"
                  >
                    <div className="py-1">
                      {categories.map(category => (
                        <button
                          key={category}
                          onClick={() => {
                            setSelectedCategory(category);
                            setShowFilterDropdown(false);
                          }}
                          className={`block px-4 py-2 text-sm w-full text-left ${
                            category === selectedCategory
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'hover:bg-gray-100 text-gray-900'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Supplements Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredSupplements.length > 0 ? (
            filteredSupplements.map(supplement => (
              <motion.div
                key={supplement.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`bg-white rounded-xl overflow-hidden transition-all duration-300 ${
                  supplement.quantity === 0
                    ? 'shadow-[0_0_30px_#fecaca] border-2 border-red-500 transform scale-[1.01]'
                    : 'shadow-lg hover:shadow-xl'
                }`}
              >
                {renderSupplementImage(supplement)}
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900">{supplement.name}</h3>
                    <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                      {supplement.category || 'General'}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm mt-2 line-clamp-2">{supplement.description}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-lg font-bold text-indigo-700">
                      {formatPrice(supplement.price)}
                    </span>
                    <span className={`text-sm font-medium ${
                      supplement.quantity > 0 ? 'text-green-600' : 'text-red-600 font-bold'
                    }`}>
                      {supplement.quantity > 0 ? `In Stock: ${supplement.quantity}` : 'OUT OF STOCK'}
                    </span>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-xs text-gray-600">Barcode: {supplement.barcode}</span>
                    {isAdmin && (
                      <div className="flex space-x-3">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setEditSupplement(supplement);
                            setSupplementForm({
                              name: supplement.name,
                              description: supplement.description,
                              price: supplement.price.toString(),
                              quantity: supplement.quantity.toString(),
                              barcode: supplement.barcode,
                              category: supplement.category || 'General',
                              image: supplement.image
                            });
                            setImagePreview(supplement.image || null);
                            setShowAdminPanel(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 p-2 rounded-full hover:bg-indigo-100 transition"
                          title="Edit"
                        >
                          <FiEdit2 size={18} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteSupplement(supplement.id)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition"
                          title="Delete"
                        >
                          <FiTrash2 size={18} />
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center py-10"
            >
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <FiSearch className="text-gray-600" size={24} />
              </div>
              <h3 className="text-xl font-medium text-gray-700">No supplements found</h3>
              <p className="text-gray-700 mt-2">Try adjusting your search or filter criteria</p>
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Admin Panel Modal */}
      <AnimatePresence>
        {showAdminPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editSupplement ? 'Edit Supplement' : 'Add New Supplement'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowAdminPanel(false);
                      setEditSupplement(null);
                      resetSupplementForm();
                    }}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <FiX size={24} />
                  </button>
                </div>

                <form onSubmit={editSupplement ? handleUpdateSupplement : handleAddSupplement}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div>
                      <div className="mb-4">
                        <label className="block text-gray-900 text-sm font-medium mb-1">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={supplementForm.name}
                          onChange={handleSupplementFormChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                          required
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-gray-900 text-sm font-medium mb-1">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={supplementForm.description}
                          onChange={handleSupplementFormChange}
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        ></textarea>
                      </div>

                      <div className="mb-4">
                        <label className="block text-gray-900 text-sm font-medium mb-1">
                          Price (IQD) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="price"
                          value={supplementForm.price}
                          onChange={handleSupplementFormChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                          required
                        />
                      </div>
                    </div>

                    {/* Right Column */}
                    <div>
                      <div className="mb-4">
                        <label className="block text-gray-900 text-sm font-medium mb-1">
                          Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="quantity"
                          value={supplementForm.quantity}
                          onChange={handleSupplementFormChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                          required
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-gray-900 text-sm font-medium mb-1">
                          Barcode <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="barcode"
                          value={supplementForm.barcode}
                          onChange={handleSupplementFormChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                          required
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-gray-900 text-sm font-medium mb-1">
                          Category
                        </label>
                        <select
                          name="category"
                          value={supplementForm.category}
                          onChange={handleSupplementFormChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        >
                          {categories.filter(c => c !== 'All').map(category => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mb-4">
                        <label className="block text-gray-900 text-sm font-medium mb-1">
                          Product Image
                        </label>
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            {imagePreview ? (
                              <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-300">
                                <img
                                  src={imagePreview}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                                <FiImage size={24} />
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="cursor-pointer">
                              <span className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                <FiUpload className="mr-2" />
                                {uploadingImage ? 'Uploading...' : 'Upload Image'}
                              </span>
                              <input
                                type="file"
                                name="image"
                                accept="image/*"
                                onChange={handleSupplementFormChange}
                                className="sr-only"
                                disabled={uploadingImage}
                              />
                            </label>
                            {(supplementForm.image || imagePreview) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSupplementForm({ ...supplementForm, image: null });
                                  setImagePreview(null);
                                }}
                                className="ml-2 text-sm text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        setShowAdminPanel(false);
                        setEditSupplement(null);
                        resetSupplementForm();
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? 'Processing...' : (editSupplement ? 'Update Supplement' : 'Add Supplement')}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Manager Modal */}
      <AnimatePresence>
        {showCategoryManager && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-xl shadow-xl w-full max-w-md"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Manage Categories</h2>
                  <button
                    onClick={() => {
                      setShowCategoryManager(false);
                      setNewCategory('');
                    }}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <FiX size={24} />
                  </button>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-900 text-sm font-medium mb-1">
                    Add New Category
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      placeholder="Enter category name"
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddCategory}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      Add
                    </motion.button>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Existing Categories</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {categories.filter(c => c !== 'All').map(category => (
                      <div
                        key={category}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="text-gray-900">{category}</span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteCategory(category)}
                          className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 transition"
                          title="Delete category"
                        >
                          <FiTrash2 size={18} />
                        </motion.button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCategoryManager(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white hover:bg-gray-50"
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
