'use client'
import { useState, useEffect, useRef } from 'react';
import { FiUser, FiLock, FiShoppingCart, FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter, FiCamera, FiRotateCw, FiX, FiCheck, FiLogOut } from 'react-icons/fi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Webcam from 'react-webcam';
import { BrowserMultiFormatReader } from '@zxing/library';

export default function PharmacySupplementManager() {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  // Product state
  const [supplements, setSupplements] = useState([
    {
      id: 1,
      name: 'Vitamin C 1000mg',
      description: 'High potency vitamin C for immune support',
      price: 12.99,
      quantity: 50,
      barcode: '123456789012',
      category: 'Vitamins',
      image: '/vitamin-c.jpg'
    },
    {
      id: 2,
      name: 'Omega-3 Fish Oil',
      description: '1000mg EPA/DHA for heart and brain health',
      price: 19.99,
      quantity: 30,
      barcode: '234567890123',
      category: 'Omega-3',
      image: '/fish-oil.jpg'
    },
    {
      id: 3,
      name: 'Probiotic 50 Billion',
      description: 'Advanced gut health formula with 15 strains',
      price: 24.99,
      quantity: 25,
      barcode: '345678901234',
      category: 'Probiotics',
      image: '/probiotic.jpg'
    },
    {
      id: 4,
      name: 'Magnesium Citrate',
      description: 'Supports muscle relaxation and sleep',
      price: 14.99,
      quantity: 40,
      barcode: '456789012345',
      category: 'Minerals',
      image: '/magnesium.jpg'
    },
    {
      id: 5,
      name: 'Collagen Peptides',
      description: 'Supports skin, hair and joint health',
      price: 27.99,
      quantity: 20,
      barcode: '567890123456',
      category: 'Protein',
      image: '/collagen.jpg'
    }
  ]);

  // Admin panel state
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [editSupplement, setEditSupplement] = useState(null);
  const [supplementForm, setSupplementForm] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    barcode: '',
    category: '',
    image: ''
  });

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Barcode scanner state
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [barcodeResult, setBarcodeResult] = useState('');
  const [facingMode, setFacingMode] = useState('environment');
  const [cameraSupported, setCameraSupported] = useState(true);
  const webcamRef = useRef(null);
  const codeReader = new BrowserMultiFormatReader();

  // Shopping cart state
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  // Categories derived from supplements
  const categories = ['All', ...new Set(supplements.map(item => item.category))];

  // Filtered supplements based on search and category
  const filteredSupplements = supplements.filter(supplement => {
    const matchesSearch = supplement.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         supplement.barcode.includes(searchTerm);
    const matchesCategory = selectedCategory === 'All' || supplement.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Check camera support
  useEffect(() => {
    if (typeof navigator !== 'undefined' && !navigator.mediaDevices) {
      setCameraSupported(false);
      toast.warn('Camera not supported in this browser. Please use Safari on iOS.');
    }
  }, []);

  // Authentication functions
  const handleLogin = (e) => {
    e.preventDefault();
    // Mock authentication - in real app, this would be an API call
    if (loginForm.email === 'usamaabubakr2210@gmail.com' && loginForm.password === '123') {
      setIsLoggedIn(true);
      setIsAdmin(true);
      setShowLoginModal(false);
      toast.success('Admin login successful');
    } else if (loginForm.email === 'user@pharmacy.com' && loginForm.password === 'user123') {
      setIsLoggedIn(true);
      setIsAdmin(false);
      setShowLoginModal(false);
      toast.success('User login successful');
    } else {
      toast.error('Invalid credentials');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setCart([]);
    toast.info('Logged out successfully');
  };

  // Admin functions
  const handleAddSupplement = (e) => {
    e.preventDefault();
    const newSupplement = {
      ...supplementForm,
      id: supplements.length + 1,
      price: parseFloat(supplementForm.price),
      quantity: parseInt(supplementForm.quantity)
    };
    setSupplements([...supplements, newSupplement]);
    setSupplementForm({
      name: '',
      description: '',
      price: '',
      quantity: '',
      barcode: '',
      category: '',
      image: ''
    });
    toast.success('Supplement added successfully');
    setShowAdminPanel(false);
  };

  const handleUpdateSupplement = (e) => {
    e.preventDefault();
    const updatedSupplements = supplements.map(supplement => 
      supplement.id === editSupplement.id ? { ...supplementForm, id: editSupplement.id } : supplement
    );
    setSupplements(updatedSupplements);
    setEditSupplement(null);
    setSupplementForm({
      name: '',
      description: '',
      price: '',
      quantity: '',
      barcode: '',
      category: '',
      image: ''
    });
    toast.success('Supplement updated successfully');
    setShowAdminPanel(false);
  };

  const handleDeleteSupplement = (id) => {
    setSupplements(supplements.filter(supplement => supplement.id !== id));
    toast.success('Supplement deleted successfully');
  };

  // Barcode scanner functions
  const startScanning = () => {
    // iOS requires HTTPS and direct user interaction
    if (window.location.protocol !== 'https:') {
      toast.error('Camera requires HTTPS connection on iOS');
      return;
    }

    if (!document.hasFocus()) {
      toast.error('Please click the scan button again to activate camera');
      return;
    }

    codeReader.decodeFromVideoDevice(facingMode, webcamRef.current.video, (result, err) => {
      if (result) {
        setBarcodeResult(result.getText());
        setSupplementForm({...supplementForm, barcode: result.getText()});
        codeReader.reset();
        setShowScannerModal(false);
      }
      if (err && !(err instanceof Error)) {
        console.error(err);
      }
    });
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  useEffect(() => {
    if (showScannerModal && cameraSupported) {
      startScanning();
    } else {
      codeReader.reset();
    }
    return () => {
      codeReader.reset();
    };
  }, [showScannerModal, facingMode, cameraSupported]);

  // Shopping cart functions
  const addToCart = (supplement) => {
    const existingItem = cart.find(item => item.id === supplement.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === supplement.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...supplement, quantity: 1 }]);
    }
    toast.success(`${supplement.name} added to cart`);
  };

  const updateCartItemQuantity = (id, quantity) => {
    if (quantity < 1) {
      removeFromCart(id);
      return;
    }
    setCart(cart.map(item => 
      item.id === id ? { ...item, quantity: parseInt(quantity) } : item
    ));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
    toast.info('Item removed from cart');
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  // Form handlers
  const handleSupplementFormChange = (e) => {
    const { name, value } = e.target;
    setSupplementForm({ ...supplementForm, [name]: value });
  };

  const handleLoginFormChange = (e) => {
    const { name, value } = e.target;
    setLoginForm({ ...loginForm, [name]: value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-700">PharmaSupps</h1>
          
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                {isAdmin && (
                  <button 
                    onClick={() => setShowAdminPanel(true)}
                    className="flex items-center space-x-1 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition"
                  >
                    <FiPlus size={18} />
                    <span className="hidden sm:inline">Add Product</span>
                  </button>
                )}
                <button 
                  onClick={() => setShowCart(true)}
                  className="relative flex items-center space-x-1 bg-white text-indigo-600 border border-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-50 transition"
                >
                  <FiShoppingCart size={18} />
                  <span className="hidden sm:inline">Cart</span>
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cart.reduce((total, item) => total + item.quantity, 0)}
                    </span>
                  )}
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition"
                >
                  <FiLogOut size={18} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="flex items-center space-x-1 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                <FiUser size={18} />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Search and Filter */}
        <div className="mb-8 bg-white rounded-xl shadow-md p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name or barcode..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50"
              >
                <FiFilter />
                <span>{selectedCategory}</span>
              </button>
              {showFilterDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20">
                  <div className="py-1">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => {
                          setSelectedCategory(category);
                          setShowFilterDropdown(false);
                        }}
                        className={`block px-4 py-2 text-sm w-full text-left ${category === selectedCategory ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Supplements Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSupplements.length > 0 ? (
            filteredSupplements.map(supplement => (
              <div key={supplement.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                  {supplement.image ? (
                    <img 
                      src={supplement.image} 
                      alt={supplement.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-500">No image available</span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-800">{supplement.name}</h3>
                    <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                      {supplement.category}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mt-2 line-clamp-2">{supplement.description}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-lg font-bold text-indigo-700">${supplement.price.toFixed(2)}</span>
                    <span className="text-sm text-gray-500">Qty: {supplement.quantity}</span>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-xs text-gray-500">Barcode: {supplement.barcode}</span>
                    {isLoggedIn && (
                      <button
                        onClick={() => addToCart(supplement)}
                        className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-indigo-700 transition"
                      >
                        Add to Cart
                      </button>
                    )}
                  </div>
                  {isAdmin && isLoggedIn && (
                    <div className="mt-3 flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setEditSupplement(supplement);
                          setSupplementForm({
                            name: supplement.name,
                            description: supplement.description,
                            price: supplement.price.toString(),
                            quantity: supplement.quantity.toString(),
                            barcode: supplement.barcode,
                            category: supplement.category,
                            image: supplement.image
                          });
                          setShowAdminPanel(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-800"
                        title="Edit"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteSupplement(supplement.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <h3 className="text-xl font-medium text-gray-600">No supplements found</h3>
              <p className="text-gray-500 mt-2">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Login</h2>
                <button onClick={() => setShowLoginModal(false)} className="text-gray-500 hover:text-gray-700">
                  <FiX size={24} />
                </button>
              </div>
              <form onSubmit={handleLogin}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="email">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={loginForm.email}
                    onChange={handleLoginFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="password">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={loginForm.password}
                    onChange={handleLoginFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition w-full"
                  >
                    Login
                  </button>
                </div>
                <div className="mt-4 text-center text-sm text-gray-600">
                  <p>Demo credentials:</p>
                  <p>Admin: admin@pharmacy.com / admin123</p>
                  <p>User: user@pharmacy.com / user123</p>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Admin Panel Modal */}
      {showAdminPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editSupplement ? 'Edit Supplement' : 'Add New Supplement'}
                </h2>
                <button onClick={() => {
                  setShowAdminPanel(false);
                  setEditSupplement(null);
                  setSupplementForm({
                    name: '',
                    description: '',
                    price: '',
                    quantity: '',
                    barcode: '',
                    category: '',
                    image: ''
                  });
                }} className="text-gray-500 hover:text-gray-700">
                  <FiX size={24} />
                </button>
              </div>
              <form onSubmit={editSupplement ? handleUpdateSupplement : handleAddSupplement}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="name">
                      Name*
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={supplementForm.name}
                      onChange={handleSupplementFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="category">
                      Category*
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={supplementForm.category}
                      onChange={handleSupplementFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.filter(c => c !== 'All').map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="price">
                      Price ($)*
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      min="0"
                      step="0.01"
                      value={supplementForm.price}
                      onChange={handleSupplementFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="quantity">
                      Quantity*
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      min="0"
                      value={supplementForm.quantity}
                      onChange={handleSupplementFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div className="mb-4 md:col-span-2">
                    <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="description">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows="3"
                      value={supplementForm.description}
                      onChange={handleSupplementFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="barcode">
                      Barcode*
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        id="barcode"
                        name="barcode"
                        value={supplementForm.barcode}
                        onChange={handleSupplementFormChange}
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!cameraSupported) {
                            toast.warn('Camera not supported in this browser. Please use Safari on iOS.');
                            return;
                          }
                          setShowScannerModal(true);
                        }}
                        className="bg-indigo-600 text-white px-3 py-2 rounded-r-lg hover:bg-indigo-700 transition"
                      >
                        <FiCamera size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="image">
                      Image URL
                    </label>
                    <input
                      type="text"
                      id="image"
                      name="image"
                      value={supplementForm.image}
                      onChange={handleSupplementFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdminPanel(false);
                      setEditSupplement(null);
                      setSupplementForm({
                        name: '',
                        description: '',
                        price: '',
                        quantity: '',
                        barcode: '',
                        category: '',
                        image: ''
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    {editSupplement ? 'Update Supplement' : 'Add Supplement'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {showScannerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Scan Barcode</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={toggleCamera}
                    className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition"
                    title="Switch Camera"
                  >
                    <FiRotateCw size={18} />
                  </button>
                  <button
                    onClick={() => setShowScannerModal(false)}
                    className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              </div>
              <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                {cameraSupported ? (
                  <Webcam
                    ref={webcamRef}
                    forceScreenshotSourceSize
                    videoConstraints={{
                      facingMode: facingMode,
                      width: { ideal: 1280 },
                      height: { ideal: 720 },
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    playsInline
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white">
                    <p>Camera not supported in this browser</p>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-white rounded-lg w-64 h-32"></div>
                </div>
              </div>
              {barcodeResult && (
                <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg">
                  Scanned: {barcodeResult}
                </div>
              )}
              <div className="mt-4 text-center text-sm text-gray-600">
                <p>Point the camera at a barcode to scan</p>
                {window.location.protocol !== 'https:' && (
                  <p className="text-red-500 mt-2">Note: Camera requires HTTPS on iOS</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shopping Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Your Cart</h2>
                <button onClick={() => setShowCart(false)} className="text-gray-500 hover:text-gray-700">
                  <FiX size={24} />
                </button>
              </div>
              {cart.length > 0 ? (
                <>
                  <div className="divide-y divide-gray-200 max-h-[60vh] overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.id} className="py-4 flex">
                        <div className="h-16 w-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                              <FiX size={20} />
                            </div>
                          )}
                        </div>
                        <div className="ml-4 flex-grow">
                          <h3 className="text-md font-medium text-gray-800">{item.name}</h3>
                          <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                          <div className="mt-2 flex items-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateCartItemQuantity(item.id, e.target.value)}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                            />
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="ml-2 text-red-600 hover:text-red-800"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="font-medium text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 border-t border-gray-200 pt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-medium text-gray-900">Total</span>
                      <span className="text-xl font-bold text-indigo-700">${calculateTotal()}</span>
                    </div>
                    <button
                      onClick={() => {
                        toast.success('Checkout completed successfully!');
                        setCart([]);
                        setShowCart(false);
                      }}
                      className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-10">
                  <FiShoppingCart size={48} className="mx-auto text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Your cart is empty</h3>
                  <p className="mt-2 text-gray-600">Add some supplements to get started</p>
                  <button
                    onClick={() => setShowCart(false)}
                    className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    Continue Shopping
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}